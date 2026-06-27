// React context provider for the multi-step enrollment wizard.
// Manages the full EnrollmentState — profile, category, documents, payment —
// and persists a draft to localStorage on demand so users can resume the
// wizard after closing the browser. Draft persistence excludes File objects
// (only names/sizes/types are saved) because localStorage cannot store Blobs.
//
// On mount (useEffect), the provider automatically hydrates any previously
// saved draft, allowing seamless session recovery. Once fully submitted,
// callers should invoke clearDraft() (see payment-step.tsx).
//
// Exports the useEnrollment() hook for child components to read/write state.

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
  type EnrollmentFormData,
} from "@/lib/enrollment-types";
import { submitEnrollmentFormData } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  // New simplified form data
  formData: EnrollmentFormData;
  updateFormData: (data: Partial<EnrollmentFormData>) => void;
  submitEnrollment: () => Promise<void>;
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
  const router = useRouter();

  // New simplified form data state
  const [formData, setFormData] = useState<EnrollmentFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    licenseCategory: "",
    documents: [],
    paymentMethod: "cash",
    paymentNotes: "",
  });

  const updateFormData = useCallback((data: Partial<EnrollmentFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const submitEnrollment = useCallback(async () => {
    const result = await submitEnrollmentFormData(formData);
    if (result.success) {
      toast.success("Student enrolled successfully!");
      router.push("/students");
    } else {
      toast.error(result.error || "Failed to submit enrollment");
    }
  }, [formData, router]);

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
        // Hydrating persisted draft must happen post-mount, not in a lazy
        // useState initializer, which would cause an SSR hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
      formData,
      updateFormData,
      submitEnrollment,
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
      formData,
      updateFormData,
      submitEnrollment,
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
