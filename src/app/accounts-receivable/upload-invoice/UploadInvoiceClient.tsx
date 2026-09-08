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
} from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  UPLOAD_INVOICE_WEBHOOK_URL,
  parseAmount,
  formatINR,
  type PartyLedgerRow,
} from '@/lib/supabase/receivables';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UploadInvoiceClient({ rows }: { rows: PartyLedgerRow[] }) {
  const { dateRange, dateLabel, showToast } = useAppContext();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

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
    const parties = new Set(filtered.map((r) => r.party_name).filter(Boolean)).size;
    return { debit, credit, outstanding: debit - credit, parties };
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
          <span className="trend up" style={{ color: 'var(--green)' }}><IndianRupee size={12} /> Debit − Credit</span>
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
                filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--separator)' }}>
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
                      <span className={`badge ${String(r.closed).toLowerCase() === 'yes' ? 'badge-green' : 'badge-orange'}`}>
                        {r.closed ?? 'No'}
                      </span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <UploadInvoiceModal onClose={() => setShowModal(false)} showToast={showToast} />}
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
