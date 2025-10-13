import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useMutation } from "convex/react";
import type { Doc } from "@/convex/_generated/dataModel";

import { api } from "@/convex/_generated/api";
import { redis } from "@/lib/index";
import { WorkspaceConfigForm } from "./WorkspaceConfigForm";
import { WorkspaceCriteriaForm } from "./WorkspaceCriteriaForm";
import { IntegrationSnippet } from "@/components/form/integration-snippet";
import { QualificationForm } from "@/components/form/qualification-form";

interface FormData {
  workspace_name: string;
  form_provider: string;
  booking_url: string;
  success_page_url: string;
  min_employees: number;
  min_funding_usd: number;
  min_revenue_usd: number;
}

export function OnboardingForm({
  setWorkspaceName,
  initialData,
}: {
  setWorkspaceName: (name: string) => void;
  initialData?: Doc<"Workspaces"> | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const createWorkspace = useMutation(api.workspaces.create);
  const updateWorkspace = useMutation(api.workspaces.update);

  const methods = useForm<FormData>({
    defaultValues: {
      workspace_name: "",
      form_provider: "",
      booking_url: "",
      success_page_url: "",
    },
  });

  // Pre-populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      methods.reset({
        workspace_name: initialData.workspace_name,
        form_provider: initialData.form_provider,
        booking_url: initialData.booking_url,
        success_page_url: initialData.success_page_url,
        min_employees: initialData.criteria?.min_employees || 400,
        min_funding_usd: initialData.criteria?.min_funding_usd || 100000000,
        min_revenue_usd: initialData.criteria?.min_revenue_usd || 50000000,
      });
    }
  }, [initialData, methods]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    function sanitizeNumber(n: unknown, fallback = 10000) {
      // Accepts string or number, returns number or fallback.
      const num = typeof n === "number" ? n : Number(n);
      return typeof num === "number" && !isNaN(num) ? num : fallback;
    }

    // Set workspace name in parent state
    setWorkspaceName(data.workspace_name);

    try {
      if (initialData) {
        await updateWorkspace({
          workspace_name: data.workspace_name,
          form_provider: data.form_provider,
          booking_url: data.booking_url,
          success_page_url: data.success_page_url,
          criteria: {
            min_employees: sanitizeNumber(data.min_employees),
            min_funding_usd: sanitizeNumber(data.min_funding_usd),
            min_revenue_usd: sanitizeNumber(data.min_revenue_usd),
          },
        });
      } else {
        await createWorkspace({
          workspace_name: data.workspace_name,
          form_provider: data.form_provider,
          booking_url: data.booking_url,
          success_page_url: data.success_page_url,
          criteria: {
            min_employees: sanitizeNumber(data.min_employees),
            min_funding_usd: sanitizeNumber(data.min_funding_usd),
            min_revenue_usd: sanitizeNumber(data.min_revenue_usd),
          },
        });
      }

      // Clear the Redis cache for this workspace
      // const cacheKey = `workspace:${data.workspace_name}`;
      // await redis.del(cacheKey);

      alert("Workspace saved successfully!");
    } catch (error) {
      alert("Error saving workspace: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const appUrl = "https://example.com";

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-4"
        autoComplete="off"
      >
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              1. Configuration
            </h2>
            <WorkspaceConfigForm />
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                onClick={() => setStep(2)}
              >
                Next
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              2. Qualification Criteria
            </h2>
            <WorkspaceCriteriaForm />
            <div className="flex justify-between">
              <button
                type="button"
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                onClick={methods.handleSubmit(async (data) => {
                  await onSubmit(data);
                  setStep(3);
                })}
              >
                {isSubmitting ? "Updating..." : "Next"}
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              3. Instructions
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Example integration snippet
                </label>
                <IntegrationSnippet
                  workspaceName={methods.getValues("workspace_name")}
                  appUrl={appUrl}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check Lead Qualification
                </label>
                <QualificationForm workspaceName={methods.getValues("workspace_name")} />
              </div>
            </div>
            <div className="flex justify-start mt-6">
              <button
                type="button"
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                onClick={() => setStep(2)}
              >
                Back
              </button>
            </div>
          </>
        )}
      </form>
    </FormProvider>
  );
}
