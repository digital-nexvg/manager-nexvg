import { useProcessingMessage } from '../../services/processing';
import './ProcessingOverlay.css';

export function ProcessingOverlay() {
  const message = useProcessingMessage();

  if (!message) {
    return null;
  }

  return (
    <div className="processing-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="processing-overlay__box">
        <span className="processing-overlay__spinner" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
