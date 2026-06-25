import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ContactDraft,
  GeoLocation,
  PortfolioSession,
  RegionInfo,
  ServiceFormDraft,
  detectRegion,
  getBudgetRanges,
  loadSession,
  saveSession,
} from "../lib/user-session";
import { getDialCodeForCountry } from "../lib/dial-codes";

interface UserSessionContextValue {
  session: PortfolioSession;
  region: RegionInfo;
  budgetRanges: string[];
  regionLoading: boolean;
  updateContact: (partial: Partial<ContactDraft>) => void;
  updateServiceForm: (partial: Partial<ServiceFormDraft>) => void;
  updateLocation: (location: GeoLocation) => void;
  clearContactDraft: () => void;
}

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PortfolioSession>(() => loadSession());
  const [regionLoading, setRegionLoading] = useState(!session.region.detected);

  useEffect(() => {
    if (session.region.detected) {
      setRegionLoading(false);
      if (!session.contact.dialCodeManual) {
        const dialCode = getDialCodeForCountry(session.region.countryCode);
        if (session.contact.dialCode !== dialCode) {
          setSession((prev) =>
            saveSession({ contact: { ...prev.contact, dialCode } })
          );
        }
      }
      return;
    }

    let active = true;
    detectRegion().then((region) => {
      if (!active) return;
      const current = loadSession();
      const dialCode = current.contact.dialCodeManual
        ? current.contact.dialCode
        : getDialCodeForCountry(region.countryCode);
      const next = saveSession({
        region,
        contact: { ...current.contact, dialCode },
      });
      setSession(next);
      setRegionLoading(false);
    });

    return () => {
      active = false;
    };
  }, [session.region.detected, session.region.countryCode, session.contact.dialCode, session.contact.dialCodeManual]);

  const updateContact = useCallback((partial: Partial<ContactDraft>) => {
    setSession((prev) => saveSession({ contact: { ...prev.contact, ...partial } }));
  }, []);

  const updateServiceForm = useCallback((partial: Partial<ServiceFormDraft>) => {
    setSession((prev) => saveSession({ serviceForm: { ...prev.serviceForm, ...partial } }));
  }, []);

  const updateLocation = useCallback((location: GeoLocation) => {
    setSession((prev) => saveSession({ location }));
  }, []);

  const clearContactDraft = useCallback(() => {
    setSession((prev) =>
      saveSession({
        contact: {
          ...prev.contact,
          fullName: "",
          email: "",
          message: "",
          companyName: "",
          budget: "",
          customBudget: "",
        },
      })
    );
  }, []);

  const budgetRanges = useMemo(
    () => getBudgetRanges(session.region.currencyCode),
    [session.region.currencyCode]
  );

  const value = useMemo(
    () => ({
      session,
      region: session.region,
      budgetRanges,
      regionLoading,
      updateContact,
      updateServiceForm,
      updateLocation,
      clearContactDraft,
    }),
    [session, budgetRanges, regionLoading, updateContact, updateServiceForm, updateLocation, clearContactDraft]
  );

  return (
    <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const ctx = useContext(UserSessionContext);
  if (!ctx) {
    throw new Error("useUserSession must be used within UserSessionProvider");
  }
  return ctx;
}
