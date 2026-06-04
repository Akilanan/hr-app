import { useState, type FormEvent } from 'react';
import { api, apiError } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { Competency, Review } from '../../api/types';
import { Spinner, Empty, Modal, Field, StatusBadge, Rating, ProgressBar } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { fmtDate } from '../../lib/format';

const STD_COMPETENCIES = ['Technical Skills', 'Communication', 'Collaboration', 'Ownership', 'Problem Solving'];

export default function ReviewsTab({ employee, manage, isSelf, onChanged }: TabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const { data, loading, error, reload } = useFetch(
    () => api.get(`/employees/${employee.id}/reviews`).then((r) => r.data.data as Review[]),
    [employee.id],
  );

  const acknowledge = async (r: Review) => {
    try {
      await api.patch(`/reviews/${r.id}`, { status: 'ACKNOWLEDGED' });
      reload();
    } catch (e) {
      alert(apiError(e));
    }
  };
  const remove = async (r: Review) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${r.id}`);
      reload();
    } catch (e) {
      alert(apiError(e));
    }
  };

  return (
    <div>
      <div className="row between mb-2">
        <div>
          <h3 style={{ fontSize: 16 }}>Performance reviews</h3>
          <span className="muted" style={{ fontSize: 13 }}>
            {data?.length ?? 0} reviews on record
          </span>
        </div>
        {manage && (
          <button className="btn primary sm" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={15} /> New review
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Empty icon="alert-triangle" title="Could not load reviews" hint={error} />
      ) : !data || data.length === 0 ? (
        <div className="card">
          <Empty icon="star" title="No performance reviews yet" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.map((r) => (
            <div className="card card-pad" key={r.id}>
              <div className="row between wrap" style={{ gap: 10 }}>
                <div className="row" style={{ gap: 12 }}>
                  <Rating value={r.overallRating} />
                  <StatusBadge value={r.status} />
                </div>
                <div className="row">
                  <span className="muted" style={{ fontSize: 13 }}>
                    {fmtDate(r.periodStart, 'MMM yyyy')} – {fmtDate(r.periodEnd, 'MMM yyyy')}
                  </span>
                  {isSelf && r.status !== 'ACKNOWLEDGED' && (
                    <button className="btn sm" onClick={() => acknowledge(r)}>
                      Acknowledge
                    </button>
                  )}
                  {manage && (
                    <button className="btn danger icon-btn" onClick={() => remove(r)} title="Delete">
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </div>
              </div>

              {r.competencies && r.competencies.length > 0 && (
                <div className="grid cols-2 mt-2" style={{ gap: '8px 24px' }}>
                  {r.competencies.map((c: Competency) => (
                    <div key={c.name}>
                      <div className="row between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5 }}>{c.name}</span>
                        <span className="muted tabular" style={{ fontSize: 12.5 }}>
                          {c.rating}/5
                        </span>
                      </div>
                      <ProgressBar value={(c.rating / 5) * 100} />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid cols-2 mt-2" style={{ gap: 16 }}>
                {r.strengths && (
                  <div>
                    <div className="section-title" style={{ color: 'var(--green)' }}>
                      Strengths
                    </div>
                    <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                      {r.strengths}
                    </p>
                  </div>
                )}
                {r.areasForImprovement && (
                  <div>
                    <div className="section-title" style={{ color: 'var(--amber)' }}>
                      Areas to improve
                    </div>
                    <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                      {r.areasForImprovement}
                    </p>
                  </div>
                )}
              </div>
              {r.reviewer && (
                <div className="faint" style={{ fontSize: 12, marginTop: 10 }}>
                  Reviewed by {r.reviewer.firstName} {r.reviewer.lastName}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddReviewModal
          employeeId={employee.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            reload();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function AddReviewModal({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const today = new Date();
  const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const [form, setForm] = useState({
    periodStart: lastYear.toISOString().slice(0, 10),
    periodEnd: today.toISOString().slice(0, 10),
    overallRating: '4',
    strengths: '',
    areasForImprovement: '',
    goalsForNextPeriod: '',
  });
  const [comps, setComps] = useState<Record<string, string>>(
    Object.fromEntries(STD_COMPETENCIES.map((c) => [c, '4'])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const competencies = STD_COMPETENCIES.map((name) => ({ name, rating: Number(comps[name]) })).filter(
        (c) => !Number.isNaN(c.rating),
      );
      await api.post(`/employees/${employeeId}/reviews`, {
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        overallRating: Number(form.overallRating),
        strengths: form.strengths || undefined,
        areasForImprovement: form.areasForImprovement || undefined,
        goalsForNextPeriod: form.goalsForNextPeriod || undefined,
        competencies,
        status: 'SUBMITTED',
      });
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
      title="New performance review"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="review-form" disabled={busy}>
            {busy ? 'Saving…' : 'Submit review'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="review-form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Period start">
            <input className="input" type="date" value={form.periodStart} onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))} />
          </Field>
          <Field label="Period end">
            <input className="input" type="date" value={form.periodEnd} onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))} />
          </Field>
        </div>
        <Field label={`Overall rating: ${form.overallRating} / 5`}>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={form.overallRating}
            onChange={(e) => setForm((f) => ({ ...f, overallRating: e.target.value }))}
          />
        </Field>
        <div className="section-title">Competencies</div>
        {STD_COMPETENCIES.map((c) => (
          <div className="row between" key={c} style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13 }}>{c}</span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={comps[c]}
              onChange={(e) => setComps((m) => ({ ...m, [c]: e.target.value }))}
              style={{ width: 160 }}
            />
            <span className="muted tabular" style={{ width: 28 }}>
              {comps[c]}
            </span>
          </div>
        ))}
        <Field label="Strengths">
          <textarea className="textarea" value={form.strengths} onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))} />
        </Field>
        <Field label="Areas for improvement">
          <textarea className="textarea" value={form.areasForImprovement} onChange={(e) => setForm((f) => ({ ...f, areasForImprovement: e.target.value }))} />
        </Field>
      </form>
    </Modal>
  );
}
