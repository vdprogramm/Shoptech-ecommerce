import { useEffect, useState } from "react";
import { IProduct, adminProductService } from "@/lib/api/admin/api-admin-product";
import { ImagePlus, X, Loader2, Layers, Smartphone, Plus, Trash2, Store } from "lucide-react";
import { toast } from "sonner";

interface ProductFormProps {
  initialData?: IProduct;
  onSubmit: (
    productPayload: any,
    variantPayload?: any[],
    attributesPayload?: { key: string; value: string }[],
  ) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  // Truyền object user đang đăng nhập từ hệ thống (bốc từ Context/Redux/LocalStorage) để check quyền
  currentUser?: { userId: string; roles: string[]; storeId?: string | null };
}

interface LocalVariant {
  sku: string;
  color: string;
  storage: string;
  price: number;
  stock: number;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  currentUser,
}: ProductFormProps) {
  // 1. State lưu dữ liệu Sản phẩm chính (store ban đầu để rỗng để bắt buộc chọn nếu là Admin)
  const [formData, setFormData] = useState({
    name: "",
    store: (currentUser?.storeId ? [currentUser.storeId] : []) as string[], // Bây giờ store là mảng để chọn nhiều
    category: "",
    brand: "",
    price: 0,
    stock: 0,
    images: [] as string[],
    description: "",
  });

  const [variants, setVariants] = useState<LocalVariant[]>([
    { sku: "", color: "Tiêu chuẩn", storage: "128GB", price: 0, stock: 10 },
  ]);

  // Thêm state lưu danh sách các Store cho Admin lựa chọn
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

  // Kiểm tra xem người dùng hiện tại có phải là Admin hay không
  const isAdmin = currentUser?.roles?.includes("ADMIN") || !currentUser?.storeId;

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsLoadingMetadata(true);
        // Nếu là ADMIN thì nạp thêm danh sách Cửa hàng (Stores)
        const [catData, brandData, storeData] = await Promise.all([
          adminProductService.getCategories?.() || Promise.resolve([]),
          adminProductService.getBrands?.() || Promise.resolve([]),
          isAdmin ? adminProductService.getStores?.() || Promise.resolve([]) : Promise.resolve([]),
        ]);

        setCategories(catData || []);
        setBrands(brandData || []);
        setStores(storeData || []);
      } catch (err) {
        console.error("Lỗi nạp metadata:", err);
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, [isAdmin]);

  useEffect(() => {
    if (initialData && initialData._id) {
      setFormData({
        name: initialData.name || "",
        store: initialData.store
          ? Array.isArray(initialData.store)
            ? initialData.store.map(getStringValue)
            : [getStringValue(initialData.store)]
          : [],
        category: getStringValue(initialData.category),
        brand: getStringValue(initialData.brand),
        price: initialData.price || 0,
        stock: initialData.stock || 0,
        images: initialData.images || [],
        description: (initialData as any).description || "",
      });

      adminProductService
        .getVariantsByProduct(initialData._id)
        .then((res: any) => {
          if (res && res.length > 0) {
            setVariants(
              res.map((v: any) => ({
                sku: v.sku,
                color: v.attributes?.["Màu sắc"] || "Tiêu chuẩn",
                storage: v.attributes?.["Dung lượng"] || "128GB",
                price: v.price,
                stock: v.stock,
              })),
            );
          }
        })
        .catch((err) => console.error(err));

      adminProductService
        .getProductAttributes(initialData._id)
        .then((res: any) => {
          if (res && res.length > 0) {
            setAttributes(res.map((a: any) => ({ key: a.key, value: a.value })));
          }
        })
        .catch((err) => console.error("Không thể lấy thông số kỹ thuật:", err));
    }
  }, [initialData?._id]);

  useEffect(() => {
    if (!initialData && currentUser?.storeId) {
      setFormData((prev) => {
        if (prev.store.length === 0) {
          return { ...prev, store: [currentUser.storeId!] };
        }
        return prev;
      });
    }
  }, [currentUser?.storeId, initialData]);

  useEffect(() => {
    if (formData.name && !initialData) {
      const slug = formData.name
        .toUpperCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^A-Z0-9-]/g, "");
      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          sku: v.sku || `${slug}-${v.storage.toUpperCase()}-${v.color.toUpperCase()}`,
        })),
      );
    }
  }, [formData.name]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleVariantChange = (index: number, field: keyof LocalVariant, value: any) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "price" || field === "stock" ? Number(value) : value,
      };
      if ((field === "color" || field === "storage") && formData.name) {
        const slug = formData.name
          .toUpperCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^A-Z0-9-]/g, "");
        updated[index].sku =
          `${slug}-${updated[index].storage.toUpperCase()}-${updated[index].color.toUpperCase()}`;
      }
      return updated;
    });
  };

  const addVariantRow = () => {
    const slug = formData.name
      ? formData.name
          .toUpperCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^A-Z0-9-]/g, "")
      : "SKU";
    setVariants([
      ...variants,
      {
        sku: `${slug}-256GB-DEN`,
        color: "Đen",
        storage: "256GB",
        price: formData.price,
        stock: 10,
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleAttributeChange = (index: number, field: "key" | "value", value: string) => {
    setAttributes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addAttributeRow = () => {
    setAttributes([...attributes, { key: "", value: "" }]);
  };

  const removeAttributeRow = (index: number) => {
    setAttributes(attributes.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsUploading(true);
      const base64Promises = Array.from(files).map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      });
      const base64Urls = await Promise.all(base64Promises);
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...base64Urls] }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.category ||
      !formData.brand ||
      !formData.store ||
      formData.store.length === 0
    ) {
      return toast.error(
        "Vui lòng điền đầy đủ các trường (*) và lựa chọn Cửa hàng/Danh mục/Thương hiệu.",
      );
    }

    // 1. Chuẩn hóa danh sách biến thể theo đúng định dạng Object lồng attributes của NestJS
    const formattedVariantsPayload = variants.map((v) => ({
      sku: v.sku.toUpperCase().trim(),
      price: Number(v.price) || Number(formData.price),
      stock: Number(v.stock) || 0,
      // Sử dụng các trường "Màu sắc", "Dung lượng" để làm Key cho attributes Map
      attributes: {
        "Màu sắc": v.color.trim(),
        "Dung lượng": v.storage.trim(),
      },
      imageUrl: formData.images[0] || "",
    }));

    // 2. Gom tất cả vào một Object duy nhất để đẩy lên API
    const productPayload = {
      name: formData.name.trim(),
      store: formData.store,
      category: formData.category,
      brand: formData.brand,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      variants: formattedVariantsPayload, // 🔥 ĐƯA MẢNG BIẾN THỂ ĐÃ FORMAT VÀO ĐÂY (Thay vì để [] như cũ)
      description: formData.description.trim() || "Chưa có mô tả.",
      images: formData.images || [],
      specs: {},
    };

    // 3. Chuẩn hóa danh sách thông số kỹ thuật
    const formattedAttributes = attributes
      .filter((a) => a.key.trim() && a.value.trim())
      .map((a) => ({
        key: a.key.trim(),
        value: a.value.trim(),
      }));

    // 4. Đẩy dữ liệu ra ngoài component cha
    onSubmit(productPayload, formattedVariantsPayload, formattedAttributes);
  };

  function getStringValue(field: any): string {
    if (!field) return "";
    if (typeof field === "object" && field._id) return field._id;
    return String(field);
  }

  if (isLoadingMetadata) {
    return (
      <div className="text-center py-10 text-xs text-muted-foreground animate-pulse">
        Đang nạp cấu hình hệ thống...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-background p-6 rounded-xl border max-w-3xl mx-auto shadow-sm text-sm text-foreground"
    >
      <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-3">
        <Smartphone className="w-5 h-5 text-primary" />
        {initialData ? "Cập nhật cấu hình sản phẩm" : "Khởi tạo sản phẩm đa biến thể"}
      </h3>

      {/* 1. THÔNG TIN CHUNG */}
      <div className="space-y-4">
        {/* 🔥 CHỈ HIỂN THỊ CHỌN CỬA HÀNG NẾU LÀ TÀI KHOẢN ADMIN */}
        {isAdmin && (
          <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
            <label className="block text-xs font-bold text-primary mb-2 uppercase flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Chỉ định thuộc về Cửa hàng (Dành cho Admin) *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-card p-1.5 rounded border border-transparent hover:border-border transition-colors">
                <input
                  type="checkbox"
                  checked={formData.store.length === stores.length && stores.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData((prev) => ({ ...prev, store: stores.map((s) => s._id) }));
                    } else {
                      setFormData((prev) => ({ ...prev, store: [] }));
                    }
                  }}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-primary">
                  Tất cả cửa hàng ({stores.length})
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-card border rounded-lg">
                {stores.map((st) => (
                  <label
                    key={st._id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.store.includes(st._id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => {
                          const currentStores = Array.isArray(prev.store) ? prev.store : [];
                          const newStores = checked
                            ? [...currentStores, st._id]
                            : currentStores.filter((id) => id !== st._id);
                          return { ...prev, store: newStores };
                        });
                      }}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="truncate">
                      🏪 {st.name}{" "}
                      <span className="text-muted-foreground text-[10px]">
                        (ID: {st._id.slice(-6)})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
            Tên thiết bị sản phẩm *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2.5 bg-card focus:outline-primary"
            placeholder="Ví dụ: iPhone 16 Pro Max"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
              Danh mục phân loại *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 bg-card focus:outline-primary h-[42px]"
              required
            >
              <option value="">-- Chọn danh mục từ hệ thống --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
              Thương hiệu hãng *
            </label>
            <select
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 bg-card focus:outline-primary h-[42px]"
              required
            >
              <option value="">-- Chọn hãng sản xuất --</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
              Giá hiển thị gốc (VNĐ) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 bg-card"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
              Tổng tồn kho định mức *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 bg-card"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
            Mô tả sản phẩm ngắn
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-card min-h-[60px] text-xs"
            placeholder="Nhập một vài thông tin mô tả giới thiệu máy..."
          />
        </div>
      </div>

      {/* 2. CẤU HÌNH BIẾN THỂ ĐỘNG */}
      <div className="border rounded-xl p-4 bg-muted/40 space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Layers className="w-4 h-4 text-primary" /> Thiết lập danh sách SKU biến thể bán hàng lẻ
          </h4>
          <button
            type="button"
            onClick={addVariantRow}
            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm phiên bản
          </button>
        </div>

        <div className="space-y-3 overflow-x-auto">
          {variants.map((v, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end bg-background p-3 rounded-lg border border-gray-200"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Mã SKU
                </label>
                <input
                  type="text"
                  value={v.sku}
                  onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                  className="w-full text-xs border rounded p-1.5 font-mono text-red-600 uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Màu sắc
                </label>
                <input
                  type="text"
                  value={v.color}
                  onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                  className="w-full text-xs border rounded p-1.5"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Dung lượng
                </label>
                <input
                  type="text"
                  value={v.storage}
                  onChange={(e) => handleVariantChange(idx, "storage", e.target.value)}
                  className="w-full text-xs border rounded p-1.5"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Giá lẻ (VNĐ)
                </label>
                <input
                  type="number"
                  value={v.price}
                  onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                  className="w-full text-xs border rounded p-1.5"
                  min="0"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                    className="w-full text-xs border rounded p-1.5"
                    min="0"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariantRow(idx)}
                  className="text-destructive hover:bg-destructive/10 p-1.5 rounded border mt-4"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {variants.length === 0 && (
            <div className="text-xs text-muted-foreground text-center italic py-4">
              Sản phẩm chưa có biến thể nào. Bấm "Thêm phiên bản" để tạo mới.
            </div>
          )}
        </div>
      </div>

      {/* THÔNG SỐ KỸ THUẬT (ATTRIBUTES) */}
      <div className="border rounded-xl p-4 bg-muted/40 space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Smartphone className="w-4 h-4 text-primary" /> Thông số kỹ thuật
          </h4>
          <button
            type="button"
            onClick={addAttributeRow}
            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm thông số
          </button>
        </div>
        <div className="space-y-3">
          {attributes.map((attr, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tên thông số (VD: RAM)"
                value={attr.key}
                onChange={(e) => handleAttributeChange(idx, "key", e.target.value)}
                className="flex-1 text-xs border rounded-lg p-2 bg-card"
              />
              <input
                type="text"
                placeholder="Giá trị (VD: 16GB)"
                value={attr.value}
                onChange={(e) => handleAttributeChange(idx, "value", e.target.value)}
                className="flex-[2] text-xs border rounded-lg p-2 bg-card"
              />
              <button
                type="button"
                onClick={() => removeAttributeRow(idx)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {attributes.length === 0 && (
            <div className="text-xs text-muted-foreground text-center italic py-2">
              Chưa có thông số kỹ thuật nào. Bấm thêm thông số để tạo mới.
            </div>
          )}
        </div>
      </div>

      {/* 3. QUẢN LÝ HÌNH ẢNH */}
      <div>
        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">
          Thư viện ảnh sản phẩm *
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {formData.images.map((img, idx) => (
            <div
              key={idx}
              className="relative group aspect-square border rounded-xl overflow-hidden bg-muted flex items-center justify-center p-1"
            >
              <img src={img} alt={`Product ${idx}`} className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 transition-colors rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-card gap-1 text-muted-foreground">
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-[10px]">Uploading...</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px] font-semibold">Tải ảnh</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* BUTTON CHỨC NĂNG */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-muted"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Đang xử lý..." : initialData ? "Cập nhật dữ liệu" : "Đăng bán sản phẩm"}
        </button>
      </div>
    </form>
  );
}
