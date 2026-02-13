export type PipelineType = 'standard-flow' | 'expedited-flow' | 'high-risk-flow' | 'batch-flow' | 'realtime-flow';
export type Destination = string;

export interface WorkItem {
  id: string;
  source: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
