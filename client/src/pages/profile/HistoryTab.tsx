import { useState, type FormEvent } from 'react';
import { api, apiError } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { HistoryEvent, Paginated } from '../../api/types';
import { Spinner, Empty, Modal, Field, toneStyle } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { eventIcon, eventTone } from '../../lib/events';
import { fmtDate, titleCase } from '../../lib/format';

const TYPES = [
  'HIRED', 'PROMOTION', 'SALARY_CHANGE', 'REVIEW', 'GOAL_CREATED', 'GOAL_COMPLETED', 'MILESTONE', 'STATUS_CHANGE', 'NOTE',
];

export default function HistoryTab({ employee, manage }: TabProps) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [showNote, setShowNote] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () =>
      api
        .get(`/employees/${employee.id}/history`, { params: { page, pageSize: 25, eventType: type || undefined } })
        .then((r) => r.data as Paginated<HistoryEvent>),
    [employee.id, page, type],
  );

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>History Card</h3>
          <span className="card-title-sub">Complete activity timeline</span>
        </div>
        <div className="row">
          <select
            className="select"
            aria-label="Filter events by type"
            style={{ width: 170 }}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All events</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {titleCase(t)}
              </option>
            ))}
          </select>
          {manage && (
            <button className="btn primary sm" onClick={() => setShowNote(true)}>
              <Icon name="plus" size={15} /> Add note
            </button>
          )}
        </div>
      </div>

      <div className="card-pad">
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <Empty icon="alert-triangle" title="Could not load history" hint={error} />
        ) : !data || data.data.length === 0 ? (
          <Empty icon="inbox" title="No events" hint="Activity will appear here as it happens." />
        ) : (
          <>
            <div className="timeline">
              {data.data.map((ev) => (
                <div className="timeline-item" key={ev.id}>
                  <div className="timeline-icon" style={toneStyle(eventTone(ev.eventType))}>
                    <Icon name={eventIcon(ev.eventType)} size={16} />
                  </div>
                  <div className="row between">
                    <div className="timeline-title">{ev.title}</div>
                    <span className="timeline-meta nowrap">{fmtDate(ev.occurredAt, 'MMM d, yyyy')}</span>
                  </div>
                  {ev.description && <div className="timeline-desc">{ev.description}</div>}
                  {ev.createdBy && <div className="timeline-meta">by {ev.createdBy}</div>}
                </div>
              ))}
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="row between mt-2">
                <span className="muted" style={{ fontSize: 13 }}>
                  Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} events
                </span>
                <div className="row">
                  <button className="btn sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <Icon name="chevron-left" size={15} /> Prev
                  </button>
                  <button
                    className="btn sm"
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <Icon name="chevron-right" size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showNote && (
        <NoteModal
          employeeId={employee.id}
          onClose={() => setShowNote(false)}
          onSaved={() => {
            setShowNote(false);
            setType('');
            setPage(1);
            reload();
          }}
        />
      )}
    </div>
  );
}

function NoteModal({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/employees/${employeeId}/history`, { title, description: description || undefined, occurredAt });
      onSaved();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Add note to timeline"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="note-form" disabled={busy}>
            {busy ? 'Saving…' : 'Add note'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="note-form" onSubmit={submit}>
        <Field label="Title">
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Details">
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
