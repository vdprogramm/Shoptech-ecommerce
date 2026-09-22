import { useEffect, useState } from "react";
import { adminProductService } from "@/lib/api/admin/api-admin-product";
import { ImagePlus, X, Loader2, Layers, Smartphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MerchantProductFormProps {
  initialData?: any;
  onSubmit: (
    productPayload: any,
    variantPayload?: any[],
    attributesPayload?: { key: string; value: string }[],
  ) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  // Lấy storeId hiện tại của merchant
  storeId: string;
}

interface LocalVariant {
  sku: string;
  attr1: string;
  attr2: string;
  price: number;
  stock: number;
}

export function MerchantProductForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  storeId,
}: MerchantProductFormProps) {
  // 1. State lưu dữ liệu Sản phẩm chính
  const [formData, setFormData] = useState({
    name: "",
    store: storeId, // Gán cứng luôn storeId
    category: "",
    brand: "",
    price: 0,
    stock: 0,
    images: [] as string[],
    description: "",
  });

  const [attr1Name, setAttr1Name] = useState("Phân loại 1");
  const [attr2Name, setAttr2Name] = useState("Phân loại 2");
  const [hasAttr2, setHasAttr2] = useState(true);

  const [variants, setVariants] = useState<LocalVariant[]>([
    { sku: "", attr1: "Tiêu chuẩn", attr2: "Mặc định", price: 0, stock: 10 },
  ]);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsLoadingMetadata(true);
        // Nạp danh sách Danh mục và Thương hiệu (dùng chung với admin service vì đó là metadata hệ thống)
        const [catData, brandData] = await Promise.all([
          adminProductService.getCategories?.() || Promise.resolve([]),
          adminProductService.getBrands?.() || Promise.resolve([]),
        ]);

        setCategories(catData || []);
        setBrands(brandData || []);
      } catch (err) {
        console.error("Lỗi nạp metadata:", err);
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        store: storeId,
        category: getStringValue(initialData.category),
        brand: getStringValue(initialData.brand),
        price: initialData.price || 0,
        stock: initialData.stock || 0,
        images: initialData.images || [],
        description: (initialData as any).description || "",
      });

      if (initialData._id) {
        adminProductService
          .getVariantsByProduct(initialData._id)
          .then((res: any) => {
            if (res && res.length > 0) {
              // Lấy tên thuộc tính từ biến thể đầu tiên
              const sampleAttrs = res[0].attributes || {};
              const keys = Object.keys(sampleAttrs);
              if (keys.length > 0) setAttr1Name(keys[0]);
              if (keys.length > 1) {
                setAttr2Name(keys[1]);
                setHasAttr2(true);
              } else {
                setHasAttr2(false);
              }

              setVariants(
                res.map((v: any) => {
                  const vKeys = Object.keys(v.attributes || {});
                  return {
                    sku: v.sku,
                    attr1: v.attributes?.[keys[0] || vKeys[0]] || "Tiêu chuẩn",
                    attr2: v.attributes?.[keys[1] || vKeys[1]] || "Mặc định",
                    price: v.price,
                    stock: v.stock,
                  };
                }),
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
    }
  }, [initialData, storeId]);

  // Tự sinh SKU mẫu dựa trên tên máy
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
          sku: v.sku || `${slug}-${v.attr2.toUpperCase()}-${v.attr1.toUpperCase()}`,
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
      if ((field === "attr1" || field === "attr2") && formData.name) {
        const slug = formData.name
          .toUpperCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^A-Z0-9-]/g, "");
        updated[index].sku =
          `${slug}-${updated[index].attr2.toUpperCase()}-${updated[index].attr1.toUpperCase()}`;
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
          sku: `${slug}-MCDINH`,
          attr1: "Tiêu chuẩn",
          attr2: "Mặc định",
          price: formData.price || 0,
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

    if (!formData.name.trim() || !formData.category || !formData.brand || !formData.store) {
      return toast.error("Vui lòng điền đầy đủ các trường (*) và lựa chọn Danh mục/Thương hiệu.");
    }
    const formattedVariantsPayload = variants.map((v) => {
      const attrs: any = {};
      if (attr1Name.trim()) attrs[attr1Name.trim()] = v.attr1.trim();
      if (hasAttr2 && attr2Name.trim()) attrs[attr2Name.trim()] = v.attr2.trim();

      return {
        sku: v.sku.toUpperCase().trim(),
        price: Number(v.price) || Number(formData.price),
        stock: Number(v.stock) || 0,
        attributes: attrs,
        imageUrl: formData.images[0] || "",
      };
    });

    const productPayload = {
      name: formData.name.trim(),
      store: Array.isArray(formData.store) ? formData.store : [formData.store],
      category: formData.category,
      brand: formData.brand,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      variants: formattedVariantsPayload,
      description: formData.description.trim() || "Chưa có mô tả.",
      images: formData.images || [],
      specs: {},
    };

    const formattedAttributes = attributes
      .filter((a) => a.key.trim() && a.value.trim())
      .map((a) => ({
        key: a.key.trim(),
        value: a.value.trim(),
      }));

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
        {initialData ? "Cập nhật cấu hình sản phẩm" : "Khởi tạo sản phẩm cho cửa hàng"}
      </h3>

      <div className="space-y-4">
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
            <Layers className="w-4 h-4 text-primary" /> Thiết lập danh sách SKU biến thể
          </h4>
          <div className="flex gap-2">
            {!hasAttr2 && (
              <button
                type="button"
                onClick={() => setHasAttr2(true)}
                className="text-xs bg-secondary text-secondary-foreground border border-gray-300 px-2 py-1 rounded-md font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm phân loại 2
              </button>
            )}
            <button
              type="button"
              onClick={addVariantRow}
              className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm phiên bản
            </button>
          </div>
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
                <input
                  type="text"
                  value={attr1Name}
                  onChange={(e) => setAttr1Name(e.target.value)}
                  className="text-[10px] font-bold text-muted-foreground uppercase bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-primary w-full mb-1"
                  placeholder="Tên phân loại 1"
                  required
                />
                <input
                  type="text"
                  value={v.attr1}
                  onChange={(e) => handleVariantChange(idx, "attr1", e.target.value)}
                  className="w-full text-xs border rounded p-1.5"
                  required
                />
              </div>
              {hasAttr2 && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <input
                      type="text"
                      value={attr2Name}
                      onChange={(e) => setAttr2Name(e.target.value)}
                      className="text-[10px] font-bold text-muted-foreground uppercase bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-primary w-full"
                      placeholder="Tên phân loại 2"
                      required
                    />
                    {idx === 0 && (
                      <button
                        type="button"
                        onClick={() => setHasAttr2(false)}
                        className="text-red-500 hover:text-red-700 ml-1"
                        title="Xóa phân loại này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={v.attr2}
                    onChange={(e) => handleVariantChange(idx, "attr2", e.target.value)}
                    className="w-full text-xs border rounded p-1.5"
                    required
                  />
                </div>
              )}
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
          {isSubmitting ? "Đang xử lý..." : initialData ? "Cập nhật dữ liệu" : "Lưu sản phẩm"}
        </button>
      </div>
    </form>
  );
}
