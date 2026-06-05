export type RetrievalQuery = {
  canvasId?: string;
  query: string;
  limit?: number;
};

export function normalizeRetrievalQuery(input: RetrievalQuery) {
  return {
    canvasId: input.canvasId,
    query: input.query.trim(),
    limit: input.limit ?? 5,
  };
}
