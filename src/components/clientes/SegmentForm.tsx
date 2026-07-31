import { useEffect, useState } from 'react';
import { createSegment, getSegments } from '../../services/segmentService';

type SegmentFormProps = {
  onClose: () => void;
  onSaved?: () => void;
};

export function SegmentForm({ onClose, onSaved }: SegmentFormProps) {
  const [segmentsText, setSegmentsText] = useState('');
  const [savedSegments, setSavedSegments] = useState<string[]>([]);

  useEffect(() => {
    setSavedSegments(getSegments());
  }, []);

  const handleSave = () => {
    const nextSegments = segmentsText
      .split('\n')
      .map((segment) => segment.trim())
      .filter(Boolean);

    nextSegments.forEach((segment) => createSegment(segment));
    setSavedSegments(getSegments());
    setSegmentsText('');
    onSaved?.();
    onClose();
  };

  return (
    <div className="clients-page__form-card clients-page__form-card--top">
      <div className="clients-page__form-head">
        <h2>Criar segmentos</h2>
        <button type="button" className="btn btn--ghost btn--close" onClick={onClose} aria-label="Fechar formulário">
          ×
        </button>
      </div>

      <div className="client-form">
        <div className="client-form__grid">
          <label className="client-form__full-width">
            <span>Segmentos</span>
            <textarea
              rows={6}
              value={segmentsText}
              onChange={(event) => setSegmentsText(event.target.value)}
              placeholder="Digite um segmento por linha"
            />
          </label>
        </div>

        {savedSegments.length ? (
          <div className="segment-list">
            <p className="segment-list__title">Segmentos salvos</p>
            <ul>
              {savedSegments.map((segment) => (
                <li key={segment}>{segment}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="client-form__actions">
          <button type="button" className="btn btn--primary" onClick={handleSave}>
            Salvar segmentos
          </button>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
