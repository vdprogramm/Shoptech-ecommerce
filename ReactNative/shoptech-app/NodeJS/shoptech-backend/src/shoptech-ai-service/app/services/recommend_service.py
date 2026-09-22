import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings

class RecommendService:
    def __init__(self):
        # Tải cấu hình Tokenizer và Model SBERT tiếng Việt từ Hugging Face Hub (Chạy Local)
        print(f"Đang nạp mô hình Deep Learning phục vụ gợi ý sản phẩm: {settings.HF_EMBEDDING_MODEL}...")
        self.tokenizer = AutoTokenizer.from_pretrained(settings.HF_EMBEDDING_MODEL)
        self.model = AutoModel.from_pretrained(settings.HF_EMBEDDING_MODEL)

        # Tự động đẩy mô hình lên GPU (CUDA) nếu máy chủ hỗ trợ tăng tốc phần cứng
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

    def _get_embeddings_batch(self, texts: list) -> np.ndarray:
        """TỐI ƯU NLP: Xử lý song song hàng loạt (Batch Processing) thay vì lặp từng câu đơn lẻ"""
        # Mã hóa toàn bộ danh sách văn bản cùng lúc, tự động padding về độ dài đồng đều
        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors="pt"
        ).to(self.device)

        # Tắt cơ chế tính Gradient để giải phóng bộ nhớ RAM/VRAM khi Inference
        with torch.no_grad():
            outputs = self.model(**inputs)

        # Áp dụng Mean Pooling song song trên ma trận đa chiều 3D (Batch_size, Sequence_length, Hidden_dim)
        attention_mask = inputs['attention_mask']
        token_embeddings = outputs.last_hidden_state

        # Nhân mở rộng mask để triệt tiêu trọng số của các token padding (khoảng trắng thừa)
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
        sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)

        batch_embeddings = sum_embeddings / sum_mask
        return batch_embeddings.cpu().numpy()

    def calculate_recommendations(self, target_id: str, all_products: list, scope_store_id: str = None, limit: int = 4) -> list:
        """
        Thuật toán Gợi ý Sản phẩm thông minh (Content-Based):
        - Hỗ trợ scope_store_id: Nếu truyền vào, hệ thống sẽ ưu tiên/chỉ gợi ý các sản phẩm trong cùng shop.
        """
        if not all_products or len(all_products) < 2:
            return []

        corpus = []
        id_map = []
        target_idx = -1

        # Biến đếm chỉ số thực sau khi lọc phạm vi dữ liệu
        current_idx = 0

        for item in all_products:
            # LẤY THÔNG TIN ĐỂ CHUYỂN ĐỔI SANG SCHEMA OBJECT PHÙ HỢP (Duyệt cả Object Mongoose hoặc Dictionary thô)
            item_id = str(item.get('_id') if isinstance(item, dict) else item.id)
            item_store = str(item.get('store') if isinstance(item, dict) else item.store)
            item_name = item.get('name') if isinstance(item, dict) else item.name
            item_category = item.get('category') if isinstance(item, dict) else item.category
            item_brand = item.get('brand') if isinstance(item, dict) else item.brand
            item_price = item.get('price') if isinstance(item, dict) else item.price

            # ĐIỀU KIỆN LỌC PHẠM VI (SCOPE):
            # Giữ lại sản phẩm nếu nó chính là sản phẩm mục tiêu HOẶC nằm trong shop được chỉ định (nếu có yêu cầu lọc)
            if scope_store_id and item_id != target_id and item_store != str(scope_store_id):
                continue

            # Feature Engineering: Xây dựng chuỗi văn bản giàu ngữ cảnh tiếng Việt
            feature_text = f"Sản phẩm {item_name} thuộc danh mục {item_category} của thương hiệu {item_brand} với mức giá {item_price} VND."
            corpus.append(feature_text)
            id_map.append(item_id)

            if item_id == target_id:
                target_idx = current_idx

            current_idx += 1

        # Nếu không tìm thấy sản phẩm mục tiêu trong tập mẫu đã lọc, thoát luồng tránh lỗi crash
        if target_idx == -1 or len(corpus) < 2:
            return []

        # TỐI ƯU CỐT LÕI: Đưa toàn bộ corpus vào xử lý vector hóa 1 lần duy nhất bằng Batch
        embeddings_matrix = self._get_embeddings_batch(corpus)

        # Tính toán ma trận khoảng cách góc Cosine Similarity
        similarity_scores = cosine_similarity(
            [embeddings_matrix[target_idx]],
            embeddings_matrix
        )[0]

        # Sắp xếp index theo độ khớp ngữ nghĩa giảm dần
        sorted_indices = np.argsort(similarity_scores)[::-1]

        # Trích xuất danh sách ID gợi ý tốt nhất
        recommended_ids = []
        for index in sorted_indices:
            if index != target_idx:
                recommended_ids.append(id_map[index])
            if len(recommended_ids) == limit:
                break

        return recommended_ids

recommend_service = RecommendService()