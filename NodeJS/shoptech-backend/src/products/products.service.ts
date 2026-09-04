import { Injectable, BadRequestException, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Product } from './schemas/product.schema';
import { ProductVariant } from '../product-variants/schemas/product-variant.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariant>,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}

  // 1. TẠO MỚI: Đã bọc try-catch bắt lỗi trùng SKU
  async create(createProductDto: CreateProductDto, user: any): Promise<Product> {
    const { variants, ...productData } = createProductDto;

    // 1. Phân quyền lấy Store ID
    let finalStoreId = user?.storeId;

    if (user?.roles?.includes('ADMIN') || !finalStoreId) {
      finalStoreId = createProductDto.store;
    }

    if (!finalStoreId) {
      throw new BadRequestException('Sản phẩm bắt buộc phải được gán vào một Cửa hàng (Store)!');
    }

    try {
      // 2. Gán finalStoreId chuẩn vào sản phẩm cha
      const newProduct = new this.productModel({
        ...productData,
        store: finalStoreId,
      });
      const savedProduct = await newProduct.save();

      // 3. Nếu có biến thể gửi kèm lúc tạo, tiến hành tạo và lưu
      if (variants && Array.isArray(variants) && variants.length > 0) {
        const createdVariants = await Promise.all(
          variants.map(v => new this.variantModel({
            ...v,
            product: savedProduct._id,
            store: finalStoreId,
            attributes: v.attributes || {}
          }).save())
        );

        savedProduct.variants = createdVariants.map(v => v._id) as any;
        await savedProduct.save();
      } else {
        // TỰ ĐỘNG TẠO BIẾN THỂ MẶC ĐỊNH NẾU KHÔNG CÓ BIẾN THỂ NÀO
        const defaultVariant = await new this.variantModel({
          product: savedProduct._id,
          store: finalStoreId,
          sku: `DF-${savedProduct._id.toString().substring(0, 10).toUpperCase()}`,
          price: savedProduct.price,
          stock: savedProduct.stock || 0,
          attributes: { 'Phân loại': 'Mặc định' }
        }).save();

        savedProduct.variants = [defaultVariant._id] as any;
        await savedProduct.save();
      }

      return this.findOne(savedProduct._id.toString());

    } catch (error: any) {
      // 🔥 BẮT LỖI TRÙNG UNIQUE KEY (E11000) TỪ MONGODB TẠI ĐÂY
      if (error.code === 11000 || error.name === 'MongoServerError') {
        const field = Object.keys(error.keyValue)[0]; // Lấy trường bị trùng (sku)
        const value = error.keyValue[field];          // Lấy giá trị bị trùng

        throw new ConflictException(
          `Mã ${field.toUpperCase()} "${value}" đã tồn tại trên hệ thống ShopTech. Vui lòng kiểm tra hoặc nhập mã SKU khác!`
        );
      }
      // Ném các lỗi validation hoặc lỗi hệ thống khác
      throw new BadRequestException(error.message);
    }
  }

  // 2. LẤY DANH SÁCH (Dành cho khách hàng xem toàn sàn)
  async findAll(query: any): Promise<Product[]> {
    const filter = { ...query };
    if (filter.name) {
      filter.name = { $regex: filter.name, $options: 'i' };
    }
    
    return this.productModel
      .find(filter)
      .populate('category brand')
      .populate('variants')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Lấy danh sách sản phẩm riêng của một Shop
  async findAllByStore(storeId: string): Promise<Product[]> {
    // Bảo vệ API tránh crash nếu truyền ID shop bậy bạ
    if (!isValidObjectId(storeId)) {
      throw new BadRequestException(`Định dạng mã Store (${storeId}) không hợp lệ!`);
    }
    return this.productModel
      .find({ store: storeId })
      .populate('category brand')
      .populate('variants')
      .sort({ createdAt: -1 })
      .exec();
  }

  // BẢO VỆ API: chi tiết sản phẩm khỏi chuỗi lỗi như "default"
  async findOne(id: string): Promise<Product> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Định dạng mã sản phẩm (ID: "${id}") không hợp lệ! Hãy kiểm tra lại link điều hướng ở Frontend.`);
    }

    const product = await this.productModel
      .findById(id)
      .populate('category brand')
      .populate({
        path: 'variants',
        model: 'ProductVariant'
      })
      .exec();

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm này');
    }
    return product;
  }

  // 3. CẬP NHẬT
  async update(id: string, updateProductDto: UpdateProductDto, storeId: string): Promise<Product> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Mã sản phẩm (ID: "${id}") không đúng định dạng ObjectId!`);
    }

    const { variants, ...productData } = updateProductDto;

    try {
      // ✅ ĐÃ SỬA LỖI WARNING CỦA MONGOOSE: Chỉ giữ lại returnDocument
      const updatedProduct = await this.productModel
        .findOneAndUpdate({ _id: id, store: storeId }, productData, {
          returnDocument: 'after'
        })
        .exec();

      if (!updatedProduct) {
        throw new NotFoundException('Không tìm thấy sản phẩm thuộc cửa hàng của bạn để cập nhật');
      }

      if (variants && Array.isArray(variants)) {
        // Chỉ xóa các biến thể thuộc sản phẩm này
        await this.variantModel.deleteMany({ product: id });

        // Tạo mới biến thể và đồng bộ storeId
        const newVariants = await Promise.all(
          variants.map(v =>
            new this.variantModel({
              ...v,
              product: id,
              store: storeId,
              attributes: v.attributes || {}
            }).save()
          )
        );

        updatedProduct.variants = newVariants.map(v => v._id) as any;
        await updatedProduct.save();
      }

      return this.findOne(id);

    } catch (error: any) {
      // 🔥 BẮT LỖI TRÙNG SKU KHI CẬP NHẬT
      if (error.code === 11000 || error.name === 'MongoServerError') {
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];

        throw new ConflictException(
          `Cập nhật thất bại! Mã ${field.toUpperCase()} "${value}" đã bị trùng với một sản phẩm khác có sẵn.`
        );
      }
      throw new BadRequestException(error.message);
    }
  }

  // 4. XÓA SẢN PHẨM: Cô lập dữ liệu bằng storeId
  async remove(id: string, storeId: string): Promise<{ message: string }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Mã sản phẩm để xóa (ID: "${id}") không đúng định dạng ObjectId!`);
    }

    const product = await this.productModel.findOne({ _id: id, store: storeId });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm thuộc cửa hàng của bạn để xóa');
    }

    await this.variantModel.deleteMany({ product: id });
    await this.productModel.findByIdAndDelete(id).exec();

    return { message: 'Đã xóa sản phẩm và tất cả biến thể đi kèm thành công' };
  }

  // 5. Cập nhật rating từ review
  async updateRating(productId: string, averageRating: number, reviewCount: number) {
    if (!isValidObjectId(productId)) return null;

    // ✅ ĐÃ SỬA WARNING CỦA MONGOOSE VÀ THÊM .exec() ĐỂ TỐI ƯU
    return this.productModel.findByIdAndUpdate(
      productId,
      { averageRating, reviewCount },
      { returnDocument: 'after' }
    ).exec();
  }

  // 6. Nhập kho biến thể cụ thể
  async addStock(variantId: string, quantityToAdd: number, storeId: string) {
    if (!isValidObjectId(variantId)) {
      throw new BadRequestException(`Mã biến thể nhập kho (ID: "${variantId}") không đúng định dạng ObjectId!`);
    }
    if (quantityToAdd <= 0) throw new BadRequestException('Số lượng nhập kho phải lớn hơn 0');

    const variant = await this.variantModel.findOne({ _id: variantId, store: storeId });
    if (!variant) throw new NotFoundException('Không tìm thấy biến thể sản phẩm này tại cửa hàng của bạn');

    variant.stock = (variant.stock || 0) + quantityToAdd;
    await variant.save();

    return {
      message: `Nhập kho biến thể thành công. Tồn kho mới: ${variant.stock}`,
      currentStock: variant.stock
    };
  }

  // 7. 🚀 TÌM SẢN PHẨM BÁN CHẠY (ĐÃ TỐI ƯU HOÁ SIÊU TỐC)
  async findBestSellers(limit: number = 10): Promise<Product[]> {
    return this.productModel
      .find({ soldCount: { $gt: 0 } }) // Chỉ lấy những sản phẩm đã có người mua
      .populate('category brand')
      .populate('variants')
      .sort({ soldCount: -1, createdAt: -1 }) // Ưu tiên số lượng bán, nếu bằng nhau thì ưu tiên sản phẩm mới tạo
      .limit(limit)
      .exec();
  }
}