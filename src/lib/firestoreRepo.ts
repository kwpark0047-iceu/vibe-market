import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import type {
  AppLanguage,
  CatalogProject,
  CommunityActivityType,
  CreatorMilestoneKind,
  DailySignalPoint,
  OwnershipClaimRecord,
  ProjectActivityRecord,
  ProjectMilestoneRecord,
  ProjectReportRecord,
} from '../types/vibeatlas';

function parseHistoricalSignals(raw: unknown): DailySignalPoint[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const parsed: DailySignalPoint[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const pt = item as Record<string, unknown>;
    if (typeof pt.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(pt.date)) continue;
    parsed.push({
      date: pt.date,
      githubStarsDelta: Math.max(0, Number(pt.githubStarsDelta) || 0),
      internalLikes: Math.max(0, Number(pt.internalLikes) || 0),
      internalBookmarks: Math.max(0, Number(pt.internalBookmarks) || 0),
    });
  }
  return parsed.length > 0 ? parsed : undefined;
}

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function buildPublicActorFields(user: User): {
  actorUid: string;
  actorName: string;
  actorHandle: string;
} {
  const displayName = (user.displayName || 'VibeAtlas Member').trim().slice(0, 100) || 'VibeAtlas Member';
  return {
    actorUid: user.uid,
    actorName: displayName,
    actorHandle: '',
  };
}

function sanitizeActivityDocId(prefix: string, suffix: string): string {
  const raw = `${prefix}_${suffix}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  return raw.slice(0, 128);
}

export async function syncSignedInUserProfile(user: User): Promise<void> {
  const publicPath = `users/${user.uid}/public/profile`;
  const privatePath = `users/${user.uid}/private/info`;

  try {
    await setDoc(
      doc(db, 'users', user.uid, 'public', 'profile'),
      {
        uid: user.uid,
        displayName: (user.displayName || 'VibeAtlas Maker').slice(0, 100),
        handle: user.email ? `@${user.email.split('@')[0].slice(0, 50)}` : '',
        bio: '',
        country: 'KR',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, publicPath);
  }

  try {
    const privateRef = doc(db, 'users', user.uid, 'private', 'info');
    const existing = await getDoc(privateRef);
    if (!existing.exists()) {
      await setDoc(privateRef, {
        uid: user.uid,
        email: (user.email || 'unknown@example.com').slice(0, 200),
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, privatePath);
  }
}

export function subscribeToFirestoreProjects(
  onData: (projects: CatalogProject[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'projects';
  const q = query(collection(db, 'projects'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CatalogProject[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          slug: String(data.slug || d.id),
          name: String(data.name || ''),
          tagline: String(data.tagline || ''),
          taglineKo: String(data.taglineKo || ''),
          description: String(data.description || ''),
          descriptionKo: String(data.descriptionKo || ''),
          contentType: data.contentType || 'web_app',
          categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
          techStack: Array.isArray(data.techStack) ? data.techStack.map(String) : [],
          developmentPlatform: data.developmentPlatform || 'custom',
          hostingProvider: data.hostingProvider || 'unknown',
          backendTech: data.backendTech || 'unknown',
          country: String(data.country || 'KR'),
          language: data.language || 'ko',
          license: String(data.license || 'Unknown'),
          pricingModel: data.pricingModel || 'free',
          verificationStatus: data.verificationStatus || 'unverified',
          provenanceSource: data.provenanceSource || 'maker_submitted',
          liveDemoUrl: String(data.liveDemoUrl || ''),
          websiteUrl: String(data.websiteUrl || ''),
          githubRepo: String(data.githubRepo || ''),
          githubUrl: String(data.githubUrl || ''),
          thumbnailUrl: String(data.thumbnailUrl || ''),
          makerName: String(data.makerName || ''),
          makerHandle: String(data.makerHandle || ''),
          ownerUid: String(data.ownerUid || ''),
          githubStars: Number(data.githubStars || 0),
          githubForks: Number(data.githubForks || 0),
          likesCount: Number(data.likesCount || 0),
          bookmarksCount: Number(data.bookmarksCount || 0),
          lastSyncedAt: String(data.lastSyncedAt || ''),
          createdAtIso: toIsoString(data.createdAt),
          updatedAtIso: toIsoString(data.updatedAt),
          isCuratedSeed: false,
          historicalSignals: parseHistoricalSignals(data.historicalSignals),
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeToUserBookmarks(
  userId: string,
  onData: (projectIds: Set<string>) => void
): Unsubscribe {
  const path = `users/${userId}/bookmarks`;
  const q = query(collection(db, 'users', userId, 'bookmarks'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      onData(new Set(snap.docs.map((d) => d.id)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createFirestoreProject(
  user: User,
  payload: Omit<
    CatalogProject,
    'id' | 'ownerUid' | 'likesCount' | 'bookmarksCount' | 'createdAtIso' | 'updatedAtIso'
  >
): Promise<string> {
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `projects/${projectId}`;
  try {
    await setDoc(doc(db, 'projects', projectId), {
      slug: payload.slug.slice(0, 100),
      name: payload.name.slice(0, 120),
      tagline: payload.tagline.slice(0, 220),
      taglineKo: payload.taglineKo.slice(0, 220),
      description: payload.description.slice(0, 4000),
      descriptionKo: payload.descriptionKo.slice(0, 4000),
      contentType: payload.contentType,
      categories: payload.categories.slice(0, 6),
      techStack: payload.techStack.slice(0, 12),
      developmentPlatform: payload.developmentPlatform,
      hostingProvider: payload.hostingProvider,
      backendTech: payload.backendTech,
      country: payload.country.slice(0, 12),
      language: payload.language,
      license: payload.license.slice(0, 64),
      pricingModel: payload.pricingModel,
      verificationStatus: 'unverified',
      provenanceSource: payload.provenanceSource,
      liveDemoUrl: payload.liveDemoUrl.slice(0, 500),
      websiteUrl: payload.websiteUrl.slice(0, 500),
      githubRepo: payload.githubRepo.slice(0, 160),
      githubUrl: payload.githubUrl.slice(0, 500),
      thumbnailUrl: payload.thumbnailUrl.slice(0, 500),
      makerName: payload.makerName.slice(0, 100),
      makerHandle: payload.makerHandle.slice(0, 80),
      ownerUid: user.uid,
      githubStars: Math.max(0, Math.floor(payload.githubStars)),
      githubForks: Math.max(0, Math.floor(payload.githubForks)),
      likesCount: 0,
      bookmarksCount: 0,
      lastSyncedAt: payload.lastSyncedAt.slice(0, 64),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return projectId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateProjectGitHubStats(
  projectId: string,
  stars: number,
  forks: number,
  license: string
): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      githubStars: Math.max(0, Math.floor(stars)),
      githubForks: Math.max(0, Math.floor(forks)),
      license: license.slice(0, 64),
      lastSyncedAt: new Date().toISOString(),
      provenanceSource: 'github_sync',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteFirestoreProject(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function toggleFirestoreBookmark(
  user: User,
  project: CatalogProject,
  currentlyBookmarked: boolean
): Promise<void> {
  const bookmarkPath = `users/${user.uid}/bookmarks/${project.id}`;
  const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', project.id);
  const activityRef = doc(
    db,
    'projectActivities',
    sanitizeActivityDocId('act_bookmark', `${project.id}_${user.uid}`)
  );
  const parentRef = doc(db, 'projects', project.id);

  try {
    const batch = writeBatch(db);
    const actor = buildPublicActorFields(user);

    if (currentlyBookmarked) {
      batch.delete(bookmarkRef);
      batch.delete(activityRef);
      if (!project.isCuratedSeed) {
        batch.update(parentRef, {
          bookmarksCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      batch.set(bookmarkRef, {
        projectId: project.id,
        projectSlug: project.slug.slice(0, 120),
        projectName: project.name.slice(0, 120),
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      batch.set(activityRef, {
        projectId: project.id.slice(0, 128),
        projectSlug: project.slug.slice(0, 120),
        ...actor,
        type: 'bookmark',
        reportReason: '',
        createdAt: serverTimestamp(),
      });
      if (!project.isCuratedSeed) {
        batch.update(parentRef, {
          bookmarksCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, bookmarkPath);
  }
}

export async function toggleFirestoreLike(
  user: User,
  project: CatalogProject,
  currentlyLiked: boolean
): Promise<void> {
  const likePath = `projects/${project.id}/likes/${user.uid}`;
  const activityRef = doc(
    db,
    'projectActivities',
    sanitizeActivityDocId('act_like', `${project.id}_${user.uid}`)
  );
  const actor = buildPublicActorFields(user);

  try {
    if (project.isCuratedSeed) {
      if (currentlyLiked) {
        await deleteDoc(activityRef);
      } else {
        await setDoc(activityRef, {
          projectId: project.id.slice(0, 128),
          projectSlug: project.slug.slice(0, 120),
          ...actor,
          type: 'like',
          reportReason: '',
          createdAt: serverTimestamp(),
        });
      }
      return;
    }

    const batch = writeBatch(db);
    const likeRef = doc(db, 'projects', project.id, 'likes', user.uid);
    const parentRef = doc(db, 'projects', project.id);

    if (currentlyLiked) {
      batch.delete(likeRef);
      batch.delete(activityRef);
      batch.update(parentRef, {
        likesCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(likeRef, {
        projectId: project.id,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      batch.set(activityRef, {
        projectId: project.id.slice(0, 128),
        projectSlug: project.slug.slice(0, 120),
        ...actor,
        type: 'like',
        reportReason: '',
        createdAt: serverTimestamp(),
      });
      batch.update(parentRef, {
        likesCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, likePath);
  }
}

export async function submitReportToFirestore(
  user: User,
  project: CatalogProject,
  reason: ProjectReportRecord['reason'],
  details: string
): Promise<void> {
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `reports/${reportId}`;
  const activityId = sanitizeActivityDocId('act_report', reportId);
  const actor = buildPublicActorFields(user);

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'reports', reportId), {
      projectId: project.id.slice(0, 128),
      projectSlug: project.slug.slice(0, 120),
      reporterUid: user.uid,
      reason,
      details: details.slice(0, 1000),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'projectActivities', activityId), {
      projectId: project.id.slice(0, 128),
      projectSlug: project.slug.slice(0, 120),
      ...actor,
      type: 'report',
      reportReason: reason,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

function mapActivityDoc(d: { id: string; data: () => Record<string, unknown> }, fallbackProjectId = ''): ProjectActivityRecord {
  const data = d.data();
  const typeRaw = data.type;
  const type: CommunityActivityType =
    typeRaw === 'bookmark' || typeRaw === 'report' ? typeRaw : 'like';
  return {
    id: d.id,
    projectId: String(data.projectId || fallbackProjectId),
    projectSlug: String(data.projectSlug || ''),
    actorUid: String(data.actorUid || ''),
    actorName: String(data.actorName || 'VibeAtlas Member'),
    actorHandle: String(data.actorHandle || ''),
    type,
    reportReason:
      type === 'report' && typeof data.reportReason === 'string'
        ? (data.reportReason as ProjectReportRecord['reason'])
        : '',
    createdAtIso: toIsoString(data.createdAt),
    source: 'firestore' as const,
  };
}

export function subscribeToProjectActivities(
  projectId: string,
  onData: (activities: ProjectActivityRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'projectActivities';
  const q = query(
    collection(db, 'projectActivities'),
    where('projectId', '==', projectId),
    limit(60)
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapActivityDoc(d, projectId)));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeToGlobalProjectActivities(
  limitCount: number,
  onData: (activities: ProjectActivityRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'projectActivities';
  const q = query(
    collection(db, 'projectActivities'),
    orderBy('createdAt', 'desc'),
    limit(Math.max(1, Math.min(80, limitCount)))
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapActivityDoc(d)));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function submitOwnershipClaimToFirestore(
  user: User,
  project: CatalogProject,
  verificationMethod: OwnershipClaimRecord['verificationMethod'],
  proofNote: string
): Promise<void> {
  const claimId = `clm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `ownershipClaims/${claimId}`;
  try {
    await setDoc(doc(db, 'ownershipClaims', claimId), {
      projectId: project.id.slice(0, 128),
      projectSlug: project.slug.slice(0, 120),
      claimantUid: user.uid,
      verificationMethod,
      proofNote: proofNote.slice(0, 1000),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeToUserReports(
  userId: string,
  onData: (reports: ProjectReportRecord[]) => void
): Unsubscribe {
  const path = 'reports';
  const q = query(collection(db, 'reports'), where('reporterUid', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            projectId: String(data.projectId || ''),
            projectSlug: String(data.projectSlug || ''),
            reporterUid: String(data.reporterUid || ''),
            reason: data.reason || 'broken_link',
            details: String(data.details || ''),
            status: data.status || 'open',
            createdAtIso: toIsoString(data.createdAt),
          };
        })
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeToUserClaims(
  userId: string,
  onData: (claims: OwnershipClaimRecord[]) => void
): Unsubscribe {
  const path = 'ownershipClaims';
  const q = query(collection(db, 'ownershipClaims'), where('claimantUid', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            projectId: String(data.projectId || ''),
            projectSlug: String(data.projectSlug || ''),
            claimantUid: String(data.claimantUid || ''),
            verificationMethod: data.verificationMethod || 'github_repo',
            proofNote: String(data.proofNote || ''),
            status: data.status || 'pending',
            createdAtIso: toIsoString(data.createdAt),
          };
        })
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function subscribeNewsletterInFirestore(
  user: User,
  email: string,
  preferredLanguage: AppLanguage
): Promise<void> {
  const subId = `sub_${user.uid.slice(0, 64)}`;
  const path = `newsletterSubscribers/${subId}`;
  try {
    await setDoc(doc(db, 'newsletterSubscribers', subId), {
      uid: user.uid,
      email: email.slice(0, 200),
      preferredLanguage,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToProjectMilestones(
  projectId: string,
  onData: (milestones: ProjectMilestoneRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'projectMilestones';
  const q = query(
    collection(db, 'projectMilestones'),
    where('projectId', '==', projectId),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: ProjectMilestoneRecord[] = snap.docs.map((d) => {
        const data = d.data();
        const kindRaw = String(data.kind || 'update');
        const kind: CreatorMilestoneKind =
          kindRaw === 'release' ||
          kindRaw === 'launch' ||
          kindRaw === 'feature' ||
          kindRaw === 'fix'
            ? kindRaw
            : 'update';
        const createdAtIso = toIsoString(data.createdAt);
        const occurredAtIso =
          typeof data.occurredAtIso === 'string' && data.occurredAtIso
            ? data.occurredAtIso
            : createdAtIso;
        return {
          id: d.id,
          projectId: String(data.projectId || projectId),
          projectSlug: String(data.projectSlug || ''),
          authorUid: String(data.authorUid || ''),
          authorName: String(data.authorName || 'Maker'),
          authorHandle: String(data.authorHandle || ''),
          kind,
          versionTag: String(data.versionTag || ''),
          title: String(data.title || ''),
          summary: String(data.summary || ''),
          externalUrl: String(data.externalUrl || ''),
          occurredAtIso,
          createdAtIso,
          source: 'firestore' as const,
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function createProjectMilestoneInFirestore(
  user: User,
  project: Pick<CatalogProject, 'id' | 'slug'>,
  payload: {
    kind: CreatorMilestoneKind;
    versionTag: string;
    title: string;
    summary: string;
    externalUrl: string;
    occurredAtIso: string;
  }
): Promise<ProjectMilestoneRecord> {
  const milestoneId = `ms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `projectMilestones/${milestoneId}`;
  const actor = buildPublicActorFields(user);

  const docPayload = {
    projectId: project.id.slice(0, 128),
    projectSlug: project.slug.slice(0, 120),
    authorUid: user.uid,
    authorName: actor.actorName.slice(0, 100),
    authorHandle: actor.actorHandle.slice(0, 80),
    kind: payload.kind,
    versionTag: payload.versionTag.trim().slice(0, 40),
    title: payload.title.trim().slice(0, 140),
    summary: payload.summary.trim().slice(0, 800),
    externalUrl: payload.externalUrl.trim().slice(0, 500),
    occurredAtIso: payload.occurredAtIso.slice(0, 40),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'projectMilestones', milestoneId), docPayload);
    return {
      id: milestoneId,
      projectId: docPayload.projectId,
      projectSlug: docPayload.projectSlug,
      authorUid: docPayload.authorUid,
      authorName: docPayload.authorName,
      authorHandle: docPayload.authorHandle,
      kind: docPayload.kind,
      versionTag: docPayload.versionTag,
      title: docPayload.title,
      summary: docPayload.summary,
      externalUrl: docPayload.externalUrl,
      occurredAtIso: docPayload.occurredAtIso,
      createdAtIso: new Date().toISOString(),
      source: 'firestore',
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteProjectMilestoneInFirestore(milestoneId: string): Promise<void> {
  const path = `projectMilestones/${milestoneId}`;
  try {
    await deleteDoc(doc(db, 'projectMilestones', milestoneId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

