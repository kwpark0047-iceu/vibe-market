import { BadgeCheck, Clock, Shield, ShieldCheck } from 'lucide-react';
import { UI_STRINGS } from '../data/i18n';
import type {
  MakerVerificationInfo,
  MakerVerificationMethod,
} from '../lib/makerVerification';
import type { AppLanguage } from '../types/vibeatlas';

interface MakerVerificationBadgeProps {
  verification: MakerVerificationInfo;
  language: AppLanguage;
  variant?: 'card' | 'header' | 'inline';
}

export function formatVerificationMethodLabel(
  method: MakerVerificationMethod | null,
  language: AppLanguage
): string {
  const copy = UI_STRINGS[language].verification;
  switch (method) {
    case 'github_repo':
      return copy.methodGithub;
    case 'domain_dns':
      return copy.methodDns;
    case 'demo_meta':
      return copy.methodDemo;
    case 'direct_submission':
      return copy.methodDirect;
    default:
      return '—';
  }
}

export function MakerVerificationBadge({
  verification,
  language,
  variant = 'card',
}: MakerVerificationBadgeProps) {
  const copy = UI_STRINGS[language].verification;

  if (verification.status === 'claimed_verified') {
    const tooltip = copy.claimedTooltip;
    if (variant === 'inline') {
      return (
        <span
          data-testid="verification-badge-claimed-inline"
          title={tooltip}
          aria-label={copy.claimedBadge}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold text-emerald-700 dark:text-emerald-400"
        >
          <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{copy.claimedBadge}</span>
        </span>
      );
    }

    if (variant === 'header') {
      return (
        <span
          data-testid="detail-verification-badge-claimed"
          title={tooltip}
          aria-label={copy.claimedBadge}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300"
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{copy.claimedBadge}</span>
        </span>
      );
    }

    return (
      <span
        data-testid="verification-badge-claimed"
        title={tooltip}
        aria-label={copy.claimedBadge}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50/90 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300"
      >
        <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{copy.claimedBadge}</span>
      </span>
    );
  }

  if (verification.status === 'claim_pending') {
    const tooltip = copy.pendingTooltip;
    if (variant === 'inline') {
      return (
        <span
          data-testid="verification-badge-pending-inline"
          title={tooltip}
          aria-label={copy.pendingBadge}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-medium text-amber-700 dark:text-amber-400"
        >
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{copy.pendingBadge}</span>
        </span>
      );
    }

    if (variant === 'header') {
      return (
        <span
          data-testid="detail-verification-badge-pending"
          title={tooltip}
          aria-label={copy.pendingBadge}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-300"
        >
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{copy.pendingBadge}</span>
        </span>
      );
    }

    return (
      <span
        data-testid="verification-badge-pending"
        title={tooltip}
        aria-label={copy.pendingBadge}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-amber-200 bg-amber-50/90 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-300"
      >
        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>{copy.pendingBadge}</span>
      </span>
    );
  }

  if (variant === 'header') {
    return (
      <span
        data-testid="detail-verification-badge-unclaimed"
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
      >
        <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{copy.unclaimedBadge}</span>
      </span>
    );
  }

  return null;
}

interface MakerTrustPanelProps {
  verification: MakerVerificationInfo;
  language: AppLanguage;
  claimFormOpen?: boolean;
  onRequestClaim?: () => void;
}

export function MakerTrustPanel({
  verification,
  language,
  claimFormOpen = false,
  onRequestClaim,
}: MakerTrustPanelProps) {
  const copy = UI_STRINGS[language].verification;
  const isClaimed = verification.status === 'claimed_verified';
  const isPending = verification.status === 'claim_pending';

  const containerStyle = isClaimed
    ? 'border-emerald-200 bg-emerald-50/45 dark:border-emerald-900/70 dark:bg-emerald-950/20'
    : isPending
      ? 'border-amber-200 bg-amber-50/45 dark:border-amber-900/70 dark:bg-amber-950/20'
      : 'border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-900/60';

  const emblemStyle = isClaimed
    ? 'border-emerald-200 bg-white text-emerald-700 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400'
    : isPending
      ? 'border-amber-200 bg-white text-amber-700 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-400'
      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';

  const title = isClaimed
    ? copy.panelTitleClaimed
    : isPending
      ? copy.panelTitlePending
      : copy.panelTitleUnclaimed;

  const body = isClaimed
    ? copy.panelBodyClaimed
    : isPending
      ? copy.panelBodyPending
      : copy.panelBodyUnclaimed;

  const statusText = isClaimed
    ? copy.statusClaimed
    : isPending
      ? copy.statusPending
      : copy.statusUnclaimed;

  const methodText = formatVerificationMethodLabel(verification.method, language);
  const makerDisplay = verification.makerHandle
    ? `${verification.makerDisplayName} (${verification.makerHandle})`
    : verification.makerDisplayName;

  return (
    <section
      data-testid="detail-maker-trust-panel"
      aria-label={title}
      className={`rounded-xl border p-4 sm:p-5 ${containerStyle}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${emblemStyle}`}
            aria-hidden="true"
          >
            {isClaimed ? (
              <ShieldCheck className="h-4 w-4" />
            ) : isPending ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
              {verification.isCurrentUserOwner && (
                <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  {copy.ownerTag}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {body}
            </p>
          </div>
        </div>

        {verification.status === 'unclaimed' && onRequestClaim && (
          <button
            type="button"
            data-testid="trust-panel-claim-btn"
            aria-expanded={claimFormOpen}
            onClick={onRequestClaim}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            <span>{copy.claimCta}</span>
          </button>
        )}
      </div>

      <dl className="mt-3.5 grid grid-cols-1 gap-2 border-t border-slate-200/80 pt-3 text-xs sm:grid-cols-3 dark:border-slate-800/80">
        <div className="min-w-0">
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">{copy.attributionLabel}</dt>
          <dd className="mt-0.5 truncate font-medium text-slate-900 dark:text-white">
            {makerDisplay || '—'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">{copy.statusLabel}</dt>
          <dd
            className={`mt-0.5 truncate font-semibold ${
              isClaimed
                ? 'text-emerald-700 dark:text-emerald-400'
                : isPending
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {statusText}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">{copy.methodLabel}</dt>
          <dd className="mt-0.5 truncate font-medium text-slate-800 dark:text-slate-200">
            {methodText}
          </dd>
        </div>
      </dl>
    </section>
  );
}
