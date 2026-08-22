export interface BookPatchRequest {
  title?: string;
  author?: string;
  price?: number;
  quantity?: number;
  categoryId?: string;
  description?: string;
  imgurl?: string;
}