'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import {
  UploadCloud,
  FileText,
  X,
  Search,
  ExternalLink,
  Receipt,
  IndianRupee,
  Users,
  Check,
  Send,
} from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  UPLOAD_INVOICE_WEBHOOK_URL,
  LEDGER_CLOSED_STATUS_WEBHOOK_URL,
  parseAmount,
  formatINR,
  type PartyLedgerRow,
} from '@/lib/supabase/receivables';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UploadInvoiceClient({ rows }: { rows: PartyLedgerRow[] }) {
  const { dateRange, dateLabel, showToast } = useAppContext();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  // Optimistic "closed" override per row id, set the moment a Yes/No click
  // succeeds against the webhook — the backend (n8n) is the real source of
  // truth and `rows` only reflects it after the next fetch, so this keeps
  // the row highlighted correctly without waiting on a reload.
  const [closedOverrides, setClosedOverrides] = useState<Record<number, 'yes' | 'no'>>({});

  const dateRows = useMemo(
    () => rows.filter((r) => isWithinDateRange(r.created_at, dateRange)),
    [rows, dateRange]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dateRows;
    return dateRows.filter((r) =>
      [r.party_name, r.voucher_no, r.bill_no, r.email, r.phone, r.gstin]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [dateRows, search]);

  const totals = useMemo(() => {
    const debit = filtered.reduce((sum, r) => sum + parseAmount(r.debit), 0);
    const credit = filtered.reduce((sum, r) => sum + parseAmount(r.credit), 0);
    // Net Outstanding is sourced from Final_Amount (maintained by the backend
    // as bills get closed / partially paid), not derived from debit - credit.
    const outstanding = filtered.reduce((sum, r) => sum + parseAmount(r.Final_Amount), 0);
    const parties = new Set(filtered.map((r) => r.party_name).filter(Boolean)).size;
    return { debit, credit, outstanding, parties };
  }, [filtered]);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Party Ledger</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            All uploaded invoices and ledger entries, live from <code>party_ledger</code>
            {dateLabel ? ` · ${dateLabel}` : ''}.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
        >
          <UploadCloud size={14} /> Upload Invoice
        </button>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Ledger Entries</span>
          <span className="value">{filtered.length}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Receipt size={12} /> In range</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Parties</span>
          <span className="value">{totals.parties}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><Users size={12} /> Distinct</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Total Debit</span>
          <span className="value">{formatINR(totals.debit)}</span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><IndianRupee size={12} /> Billed</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Net Outstanding</span>
          <span className="value">{formatINR(totals.outstanding)}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><IndianRupee size={12} /> Final_Amount</span>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Ledger</h3>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
            <input
              type="text"
              placeholder="Search party, voucher, bill, GSTIN..."
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px 8px 30px', fontSize: '13px', width: '260px' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Party</th>
                <th style={{ padding: '12px 8px' }}>Particulars</th>
                <th style={{ padding: '12px 8px' }}>Voucher No.</th>
                <th style={{ padding: '12px 8px' }}>Bill No.</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Debit</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Credit</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Running Balance</th>
                <th style={{ padding: '12px 8px' }}>Closed</th>
                <th style={{ padding: '12px 8px' }}>Created</th>
                <th style={{ padding: '12px 8px' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)' }}>
                    No ledger entries in this date range.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const effectiveClosed = closedOverrides[r.id] ?? (String(r.closed).toLowerCase() === 'yes' ? 'yes' : 'no');
                  const isRowClosed = effectiveClosed === 'yes';
                  return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid var(--separator)',
                      background: isRowClosed ? 'rgba(52, 199, 89, 0.14)' : undefined,
                      boxShadow: isRowClosed ? 'inset 3px 0 0 var(--green)' : undefined,
                      transition: 'background 200ms ease',
                    }}
                  >
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ fontWeight: '700', display: 'block' }}>{r.party_name ?? '—'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>
                        {r.email ?? '—'}{r.phone ? ` • ${r.phone}` : ''}
                      </span>
                      {r.gstin && (
                        <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', display: 'block' }}>GSTIN: {r.gstin}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ display: 'block' }}>{r.particulars ?? '—'}</span>
                      {r.narration && (
                        <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)' }}>{r.narration}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{r.voucher_no ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}>{r.bill_no ?? '—'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>
                      {r.debit ? formatINR(parseAmount(r.debit)) : '—'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: parseAmount(r.credit) > 0 ? 'var(--green)' : undefined }}>
                      {r.credit ? formatINR(parseAmount(r.credit)) : '—'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700' }}>
                      {r.running_balance ? formatINR(parseAmount(r.running_balance)) : '—'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <ClosedStatusControl
                        row={r}
                        showToast={showToast}
                        effectiveClosed={effectiveClosed}
                        onClosedChange={(value) => setClosedOverrides((prev) => ({ ...prev, [r.id]: value }))}
                      />
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--blue)', fontSize: '12px' }}
                        >
                          <ExternalLink size={12} /> Open
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <UploadInvoiceModal onClose={() => setShowModal(false)} showToast={showToast} />}
    </div>
  );
}

/**
 * Per-row control in the "Closed" column: a Yes/No pair where Yes opens a
 * confirmation modal ("Confirm full payment received") before anything is
 * sent, and No posts immediately. The webhook payload always carries the
 * row's debit amount, plus the partial-payment amount too if one was
 * entered in the field below. Nothing here writes to Supabase directly —
 * the webhook (n8n) is the source of truth for applying the update, same
 * pattern as the Upload Invoice modal.
 */
function ClosedStatusControl({
  row,
  showToast,
  effectiveClosed,
  onClosedChange,
}: {
  row: PartyLedgerRow;
  showToast: (message: string, type?: string) => void;
  effectiveClosed: 'yes' | 'no';
  onClosedChange: (value: 'yes' | 'no') => void;
}) {
  const isClosed = effectiveClosed === 'yes';
  const [sendingClosed, setSendingClosed] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState('');
  const [sendingAmount, setSendingAmount] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const debitAmount = parseAmount(row.debit);
  const partialAmount = amount.trim() ? Number(amount.trim()) : null;
  const hasValidPartial = partialAmount !== null && Number.isFinite(partialAmount) && partialAmount > 0;

  const basePayload = {
    id: row.id,
    party_name: row.party_name,
    voucher_no: row.voucher_no,
    bill_no: row.bill_no,
    gstin: row.gstin,
  };

  const sendClosedYes = async () => {
    setSendingClosed('yes');
    try {
      const res = await fetch(LEDGER_CLOSED_STATUS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...basePayload,
          action: 'closed_status',
          closed: 'yes',
          debit: debitAmount,
          ...(hasValidPartial ? { partial_amount: partialAmount } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      onClosedChange('yes');
      setConfirmOpen(false);
      showToast(`Marked bill ${row.bill_no ?? row.voucher_no ?? row.id} as closed.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update closed status.', 'error');
    } finally {
      setSendingClosed(null);
    }
  };

  const sendClosedNo = async () => {
    setSendingClosed('no');
    try {
      const res = await fetch(LEDGER_CLOSED_STATUS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, action: 'closed_status', closed: 'no' }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      onClosedChange('no');
      showToast(`Marked bill ${row.bill_no ?? row.voucher_no ?? row.id} as not closed.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update closed status.', 'error');
    } finally {
      setSendingClosed(null);
    }
  };

  const sendPartialPayment = async () => {
    if (!hasValidPartial || partialAmount === null) {
      showToast('Enter a valid partial payment amount.', 'error');
      return;
    }
    setSendingAmount(true);
    try {
      const res = await fetch(LEDGER_CLOSED_STATUS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, action: 'partial_payment', debit: debitAmount, amount: partialAmount }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      showToast(`Partial payment of ${formatINR(partialAmount)} sent for bill ${row.bill_no ?? row.voucher_no ?? row.id}.`, 'success');
      setAmount('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send partial payment.', 'error');
    } finally {
      setSendingAmount(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
      {isClosed ? (
        <span
          className="badge badge-green"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content', fontSize: '11px' }}
        >
          <Check size={11} /> Closed
        </span>
      ) : (
        <>
          <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', width: 'fit-content' }}>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={sendingClosed !== null}
              title="Mark this bill as closed"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 700,
                border: 'none', cursor: sendingClosed ? 'wait' : 'pointer',
                background: 'var(--fill-quaternary)',
                color: 'var(--label-secondary)',
                opacity: sendingClosed !== null && sendingClosed !== 'yes' ? 0.5 : 1,
              }}
            >
              {sendingClosed === 'yes' && (
                <span className="animate-spin" style={{ width: '9px', height: '9px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
              )}
              Yes
            </button>
            <button
              onClick={sendClosedNo}
              disabled={sendingClosed !== null}
              title="Mark this bill as not closed"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 700,
                border: 'none', borderLeft: '1px solid var(--glass-border)', cursor: sendingClosed ? 'wait' : 'pointer',
                background: 'var(--orange)',
                color: '#fff',
                opacity: sendingClosed !== null && sendingClosed !== 'no' ? 0.5 : 1,
              }}
            >
              {sendingClosed === 'no' ? (
                <span className="animate-spin" style={{ width: '9px', height: '9px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
              ) : (
                <Check size={11} />
              )}
              No
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendPartialPayment();
              }}
              placeholder="Partial ₹"
              className="input"
              style={{ width: '84px', padding: '4px 6px', fontSize: '11px' }}
            />
            <button
              onClick={sendPartialPayment}
              disabled={sendingAmount || !amount.trim()}
              title="Send partial payment amount"
              className="btn-icon"
              style={{
                width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: sendingAmount || !amount.trim() ? 0.5 : 1, cursor: sendingAmount || !amount.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {sendingAmount ? (
                <span className="animate-spin" style={{ width: '10px', height: '10px', border: '1.5px solid var(--label-secondary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
              ) : (
                <Send size={11} />
              )}
            </button>
          </div>
        </>
      )}

      {confirmOpen && (
        <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => !sendingClosed && setConfirmOpen(false)}>
          <div className="spotlight-panel" style={{ maxWidth: '420px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>Confirm Full Payment Received</span>
              <button className="btn-icon" onClick={() => setConfirmOpen(false)} disabled={sendingClosed !== null}><X size={14} /></button>
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)' }}>
              <p style={{ fontSize: '13.5px', color: 'var(--label-secondary)', margin: '0 0 14px', lineHeight: 1.5 }}>
                Confirm that <strong style={{ color: 'var(--label-primary)' }}>{row.party_name ?? 'this party'}</strong>&rsquo;s bill{' '}
                <strong style={{ color: 'var(--label-primary)' }}>{row.bill_no ?? row.voucher_no ?? row.id}</strong> has received full payment.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--fill-quaternary)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--label-tertiary)' }}>Debit amount</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(debitAmount)}</span>
                </div>
                {hasValidPartial && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--label-tertiary)' }}>Partial amount entered</span>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>{formatINR(partialAmount as number)}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setConfirmOpen(false)} disabled={sendingClosed !== null}>Cancel</button>
              <button
                className="btn-primary"
                onClick={sendClosedYes}
                disabled={sendingClosed !== null}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--green)', opacity: sendingClosed ? 0.7 : 1 }}
              >
                {sendingClosed === 'yes' ? (
                  <span className="animate-spin" style={{ width: '13px', height: '13px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                ) : (
                  <Check size={14} />
                )}
                Yes, confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadInvoiceModal({
  onClose,
  showToast,
}: {
  onClose: () => void;
  showToast: (message: string, type?: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit = !!file && emailValid && voucherNo.trim().length > 0 && !submitting;

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async () => {
    if (!canSubmit || !file) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('invoice', file, file.name);
      form.append('email', email.trim());
      form.append('voucher_no', voucherNo.trim());
      if (phone.trim().length > 0) form.append('phone', phone.trim());

      const res = await fetch(UPLOAD_INVOICE_WEBHOOK_URL, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

      showToast('Invoice uploaded and sent for processing.', 'success');
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload invoice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--label-secondary)', display: 'block', marginBottom: '6px',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)',
    background: 'var(--fill-quaternary)', color: 'var(--label-primary)', fontSize: '13px', boxSizing: 'border-box',
  };

  return (
    <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="spotlight-panel" style={{ maxWidth: '520px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud style={{ color: 'var(--blue)' }} size={18} />
            <span style={{ fontWeight: '700', fontSize: '16px' }}>Upload Invoice</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Invoice File <span style={{ color: 'var(--red)' }}>*</span></label>
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--fill-quaternary)' }}>
                  <FileText size={16} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button className="btn-icon" onClick={clearFile} title="Remove file" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--label-secondary)' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px 16px', borderRadius: '12px', border: '1.5px dashed var(--glass-border)', background: 'var(--fill-quaternary)', cursor: 'pointer', color: 'var(--label-secondary)' }}
                >
                  <UploadCloud size={22} style={{ color: 'var(--blue)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label-primary)' }}>Click to choose an invoice</span>
                  <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>PDF, image, or document</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <label style={labelStyle}>Email <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="billing@retailer.com" style={inputStyle} />
              {email.length > 0 && !emailValid && (
                <span style={{ fontSize: '11px', color: 'var(--red)', display: 'block', marginTop: '4px' }}>Enter a valid email address.</span>
              )}
            </div>

            <div>
              <label style={labelStyle}>Voucher No. <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="text" value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} placeholder="VCH-2026-0001" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Phone Number (optional)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={!canSubmit}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {submitting ? (
              <>
                <span className="animate-spin" style={{ width: '13px', height: '13px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Uploading...
              </>
            ) : (
              <><UploadCloud size={14} /> Upload Invoice</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
