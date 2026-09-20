import {
  summaryErrorResponse,
  validateSummaryRequest,
} from '../shared/summary-request.ts';

interface EdgeContext {
  next(): Promise<Response>;
}

export default async function summaryGuard(
  request: Request,
  context: EdgeContext,
): Promise<Response> {
  const validation = validateSummaryRequest(request);
  if (!validation.ok) {
    return summaryErrorResponse(
      validation.message,
      validation.status,
      request.method === 'HEAD',
    );
  }

  return context.next();
}
