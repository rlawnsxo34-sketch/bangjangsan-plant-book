/** 설계 계약 v1. 구현은 포함하지 않으며 권한은 서버에서 강제한다. */
export type ID = string;
export type ISODate = string;
export type Point = { lat: number; lng: number };
export type ShareStatus = 'private' | 'pending' | 'published' | 'rejected' | 'withdrawn';
export type LocationSource = 'gps' | 'map' | 'center_only' | 'legacy_unspecified';
export type IdentificationStatus = 'unknown' | 'user_selected' | 'staff_reviewed';
export interface Profile { id: ID; displayAlias: string; createdAt: ISODate; }
export interface Center {
  id: ID; name: string; region: string; address: string; active: boolean;
  mapCenter: Point | null; targetSpeciesIds: ID[];
  sourceUrl: string | null; verifiedAt: ISODate | null; isDemo: boolean;
}
export interface Species {
  id: ID; commonName: string; scientificName: string | null; description: string;
  sources: { title: string; url: string; license: string }[];
  contentStatus: 'draft' | 'reviewed'; isDemo: boolean;
}
export interface Identification {
  status: IdentificationStatus; selectedSpeciesId: ID | null;
  provider: string | null; modelVersion: string | null; requestedAt: ISODate | null;
  candidates: { label: string; scientificName: string | null; score: number | null }[];
}
/** 개인 원본. public API에서 그대로 반환하지 않는다. */
export interface Observation {
  id: ID; ownerId: ID; centerId: ID; speciesId: ID | null; name: string; note: string;
  mediaId: ID; observedAt: ISODate | null; coordinates: Point | null;
  locationSource: LocationSource; identification: Identification;
  createdAt: ISODate; updatedAt: ISODate; revision: number;
  shareStatus: ShareStatus; importLegacyId: ID | null;
}
export interface Media {
  id: ID; ownerId: ID; observationId: ID; privateObjectKey: string;
  mime: 'image/jpeg'; bytes: number; width: number; height: number;
  state: 'staging' | 'ready' | 'deleting';
}
/** 공유 신청 화면에서 사용자가 확인한 사본. 정밀 좌표는 동의한 경우만 포함. */
export interface ShareSubmission {
  id: ID; observationId: ID; originalRevision: number; ownerId: ID; centerId: ID;
  speciesId: ID | null; name: string; publicNote: string; mediaId: ID;
  displayAlias: string | null; observedDate: string | null;
  locationConsent: 'center_only' | 'observation_point'; approvedPoint: Point | null;
  submittedAt: ISODate; status: 'pending' | 'approved' | 'rejected' | 'stale';
}
/** 공개용 allowlist. 원본/사진 경로/메일/ownerId/정밀 GPS 필드를 복사하지 않는다. */
export interface PublicObservation {
  id: ID; centerId: ID; speciesId: ID | null; name: string; publicNote: string;
  publicPhotoId: ID; displayAlias: string | null; observedDate: string | null;
  location: { kind: 'center' | 'observation_point'; point: Point | null; label: string };
  review: { status: 'staff_reviewed'; reviewedAt: ISODate; scope: string };
  publishedAt: ISODate; isDemo: boolean;
}
export interface Review {
  id: ID; submissionId: ID; reviewerId: ID; centerId: ID; originalRevision: number;
  decision: 'approve' | 'reject'; reason: string; scope: string;
  suggestedSpeciesId: ID | null; createdAt: ISODate;
}
export interface ReviewerGrant { userId: ID; centerId: ID; grantedBy: ID; grantedAt: ISODate; }
export interface Page<T> { items: T[]; nextCursor: string | null; }
export type RepositoryErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'CONFLICT' |
  'VALIDATION' | 'QUOTA' | 'NETWORK' | 'NOT_FOUND' | 'UPLOAD_INCOMPLETE';
/** 임의 ownerId/role/검토 상태를 쓰는 범용 save 함수를 만들지 않는다. */
export interface ObservationRepository {
  listMine(cursor?: string): Promise<Page<Observation>>;
  listPublic(centerId: ID, cursor?: string): Promise<Page<PublicObservation>>;
  createDraft(input: {
    requestId: ID; centerId: ID; name: string; note: string; speciesId: ID | null;
    observedAt: ISODate | null; coordinates: Point | null; locationSource: LocationSource;
  }): Promise<{ observationId: ID; mediaId: ID; revision: number }>;
  uploadPhoto(mediaId: ID, photo: Blob, signal?: AbortSignal): Promise<void>;
  finalize(observationId: ID, expectedRevision: number): Promise<Observation>;
  update(observationId: ID, expectedRevision: number, patch: {
    name?: string; note?: string; speciesId?: ID | null; centerId?: ID;
    observedAt?: ISODate | null; coordinates?: Point | null; locationSource?: LocationSource;
  }): Promise<Observation>;
  requestShare(observationId: ID, expectedRevision: number, options: {
    publicNote: string; displayAlias: string | null;
    locationConsent: 'center_only' | 'observation_point';
  }): Promise<ShareSubmission>;
  withdrawShare(observationId: ID, expectedRevision: number): Promise<Observation>;
  remove(observationId: ID, expectedRevision: number): Promise<void>;
  listPending(centerId: ID, cursor?: string): Promise<Page<ShareSubmission>>;
  review(submissionId: ID, expectedOriginalRevision: number, decision: {
    action: 'approve' | 'reject'; reason: string; scope: string; suggestedSpeciesId: ID | null;
  }): Promise<Review>;
}
export interface IdentificationProvider {
  /** 서버 전용. AI 요청 전에 인증 사용자와 media 소유권을 검사한다. */
  identify(mediaId: ID, requestId: ID, signal?: AbortSignal): Promise<Identification>;
}
