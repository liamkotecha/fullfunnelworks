"use client";

import { trackEvent } from "@/lib/analytics";

/**
 * usePortalAnalytics — provides event tracking functions for portal pages.
 * All functions are safe to call — silent fail if GA4 not loaded.
 */
export function usePortalAnalytics() {
  return {
    trackAssessmentStarted: (section: string) =>
      trackEvent("assessment_started", { section }),

    trackSectionCompleted: (
      section: string,
      subSection: string,
      score: number
    ) =>
      trackEvent("section_completed", {
        section,
        sub_section: subSection,
        completion_score: score,
      }),

    trackModuleCompleted: (moduleId: string) =>
      trackEvent("module_completed", { module_id: moduleId }),

    trackReportDownloaded: () => trackEvent("report_downloaded"),

    trackPortalPageView: (pageName: string) =>
      trackEvent("portal_page_view", { page_name: pageName }),
  };
}
