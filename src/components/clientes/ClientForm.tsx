import { useEffect, useMemo, useState } from 'react';
import type { ClientFormData, ClientStatus } from '../../types';
import { createSegment, getSegments } from '../../services/segmentService';

type ClientFormProps = {
  formData: ClientFormData;
  isEditing: boolean;
  onChange: (field: keyof ClientFormData, value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

const statusOptions: ClientStatus[] = ['active', 'inactive', 'waiting-entry'];

export function ClientForm({
  formData,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const [segmentInput, setSegmentInput] = useState('');
  const [segments, setSegments] = useState<string[]>(() => getSegments());

  useEffect(() => {
    setSegments(getSegments());
  }, []);

  const availableSegments = useMemo(() => segments, [segments]);

  const handleCreateSegment = () => {
    const nextSegments = createSegment(segmentInput);
    setSegments(nextSegments);
    if (nextSegments.length) {
      onChange('segment', nextSegments[nextSegments.length - 1]);
    }
    setSegmentInput('');
  };

  return (
    <form
      className="client-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="client-form__grid">
        <label>
          <span>Nome da empresa</span>
          <input
            required
            value={formData.companyName}
            onChange={(event) => onChange('companyName', event.target.value)}
          />
        </label>

        <label>
          <span>Responsável</span>
          <input
            required
            value={formData.responsible}
            onChange={(event) => onChange('responsible', event.target.value)}
          />
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            value={formData.email}
            onChange={(event) => onChange('email', event.target.value)}
          />
        </label>

        <label className="client-form__full-width">
          <span>Endereço</span>
          <input
            value={formData.address}
            onChange={(event) => onChange('address', event.target.value)}
          />
        </label>

        <label className="client-form__full-width">
          <span>Observações</span>
          <textarea
            rows={2}
            value={formData.observations}
            onChange={(event) => onChange('observations', event.target.value)}
          />
        </label>

        <label>
          <span>Situação interna</span>
          <select
            value={formData.status}
            onChange={(event) => onChange('status', event.target.value as ClientStatus)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'active' ? 'Ativo' : status === 'inactive' ? 'Inativo' : 'Aguardando entrada'}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Segmento</span>
          <select value={formData.segment ?? ''} onChange={(event) => onChange('segment', event.target.value)}>
            <option value="">Sem segmento</option>
            {availableSegments.map((segment) => (
              <option key={segment} value={segment}>
                {segment}
              </option>
            ))}
          </select>
        </label>

        <label className="client-form__full-width">
          <span>Criar segmento</span>
          <div className="client-form__segment-actions">
            <input
              value={segmentInput}
              onChange={(event) => setSegmentInput(event.target.value)}
              placeholder="Nome do segmento"
            />
            <button type="button" className="btn btn--secondary" onClick={handleCreateSegment}>
              Criar
            </button>
          </div>
        </label>
      </div>

      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary">
          {isEditing ? 'Salvar alterações' : 'Adicionar cliente'}
        </button>

        {isEditing && onCancel ? (
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
