"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ENROLLMENT_DRAFT_KEY,
  INITIAL_ENROLLMENT_STATE,
  type EnrollmentState,
  type LicenseCategoryId,
  type EnrollmentProfile,
  type EnrollmentDocumentKey,
  type UploadedDocument,
} from "@/lib/enrollment-types";

type EnrollmentContextValue = {
  state: EnrollmentState;
  draftLoaded: boolean;
  setStep: (step: number) => void;
  updateProfile: (profile: Partial<EnrollmentProfile>) => void;
  setCategory: (categoryId: LicenseCategoryId) => void;
  setDocument: (
    key: EnrollmentDocumentKey,
    document: UploadedDocument | null,
  ) => void;
  setPaymentPhone: (phone: string) => void;
  setPaymentRequestSent: (sent: boolean) => void;
  saveDraft: () => void;
  loadDraft: () => boolean;
  clearDraft: () => void;
  resetEnrollment: () => void;
};

const EnrollmentContext = createContext<EnrollmentContextValue | null>(null);

type PersistedDraft = Omit<EnrollmentState, "documents"> & {
  documents: Partial<
    Record<
      EnrollmentDocumentKey,
      { name: string; size: number; type: string }
    >
  >;
};

export function EnrollmentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EnrollmentState>(INITIAL_ENROLLMENT_STATE);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const setStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const updateProfile = useCallback((profile: Partial<EnrollmentProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...profile },
    }));
  }, []);

  const setCategory = useCallback((categoryId: LicenseCategoryId) => {
    setState((prev) => ({ ...prev, categoryId }));
  }, []);

  const setDocument = useCallback(
    (key: EnrollmentDocumentKey, document: UploadedDocument | null) => {
      setState((prev) => {
        const documents = { ...prev.documents };
        if (document) {
          documents[key] = document;
        } else {
          delete documents[key];
        }
        return { ...prev, documents };
      });
    },
    [],
  );

  const setPaymentPhone = useCallback((phone: string) => {
    setState((prev) => ({ ...prev, paymentPhone: phone }));
  }, []);

  const setPaymentRequestSent = useCallback((sent: boolean) => {
    setState((prev) => ({ ...prev, paymentRequestSent: sent }));
  }, []);

  const saveDraft = useCallback(() => {
    const draft: PersistedDraft = {
      ...state,
      documents: Object.fromEntries(
        Object.entries(state.documents).map(([key, doc]) => [
          key,
          doc
            ? { name: doc.name, size: doc.size, type: doc.file.type }
            : undefined,
        ]),
      ),
    };
    localStorage.setItem(ENROLLMENT_DRAFT_KEY, JSON.stringify(draft));
  }, [state]);

  const loadDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(ENROLLMENT_DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw) as PersistedDraft;
      setState({
        ...INITIAL_ENROLLMENT_STATE,
        ...draft,
        documents: {},
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(ENROLLMENT_DRAFT_KEY);
  }, []);

  const resetEnrollment = useCallback(() => {
    setState(INITIAL_ENROLLMENT_STATE);
    clearDraft();
  }, [clearDraft]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ENROLLMENT_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as PersistedDraft;
        setState({
          ...INITIAL_ENROLLMENT_STATE,
          ...draft,
          documents: {},
        });
      }
    } catch {
      /* ignore corrupt draft */
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      draftLoaded,
      setStep,
      updateProfile,
      setCategory,
      setDocument,
      setPaymentPhone,
      setPaymentRequestSent,
      saveDraft,
      loadDraft,
      clearDraft,
      resetEnrollment,
    }),
    [
      state,
      draftLoaded,
      setStep,
      updateProfile,
      setCategory,
      setDocument,
      setPaymentPhone,
      setPaymentRequestSent,
      saveDraft,
      loadDraft,
      clearDraft,
      resetEnrollment,
    ],
  );

  return (
    <EnrollmentContext.Provider value={value}>
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollment() {
  const ctx = useContext(EnrollmentContext);
  if (!ctx) {
    throw new Error("useEnrollment must be used within EnrollmentProvider");
  }
  return ctx;
}
