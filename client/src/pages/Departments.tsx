import { useState, type FormEvent } from 'react';
import { api, apiError } from '../api/client';
import { useFetch } from '../lib/useFetch';
import type { Department } from '../api/types';
import { PageHeader, Spinner, Empty, Modal, Field } from '../components/ui';
import { Icon } from '../components/Icon';
import { useConfirm } from '../components/useConfirm';
import { useToast } from '../components/useToast';

export default function Departments() {
  const confirm = useConfirm();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(
    () => api.get('/departments').then((r) => r.data.data as Department[]),
    [],
  );
  const [editing, setEditing] = useState<Department | null>(null);
  const [showForm, setShowForm] = useState(false);

  const remove = async (d: Department) => {
    if (!(await confirm({ title: 'Delete department', message: `Delete “${d.name}”? Employees in it will be unassigned.`, confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/departments/${d.id}`);
      reload();
    } catch (e) {
      toast(apiError(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Organizational units"
        actions={
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Icon name="plus" size={15} /> Add department
          </button>
        }
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <Empty icon="alert-triangle" title="Could not load departments" hint={error} />
      ) : !data || data.length === 0 ? (
        <Empty icon="building" title="No departments yet" />
      ) : (
        <div className="grid cols-3">
          {data.map((d) => (
            <div key={d.id} className="card card-pad">
              <div className="row between">
                <h3 style={{ fontSize: 15 }}>{d.name}</h3>
                <span className="badge blue">{d._count?.employees ?? 0} people</span>
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 8, minHeight: 36 }}>
                {d.description || 'No description'}
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                <button
                  className="btn sm"
                  onClick={() => {
                    setEditing(d);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button className="btn sm danger" onClick={() => remove(d)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DepartmentForm
          department={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function DepartmentForm({
  department,
  onClose,
  onSaved,
}: {
  department: Department | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(department?.name ?? '');
  const [description, setDescription] = useState(department?.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (department) {
        await api.patch(`/departments/${department.id}`, { name, description });
      } else {
        await api.post('/departments', { name, description });
      }
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
      title={department ? 'Edit department' : 'Add department'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="dept-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="dept-form" onSubmit={submit}>
        <Field label="Name">
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Description">
          <textarea className="textarea" value={description ?? ''} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
