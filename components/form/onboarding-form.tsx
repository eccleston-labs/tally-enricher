import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceConfigForm } from "./WorkspaceConfigForm";
import { WorkspaceCriteriaForm } from "./WorkspaceCriteriaForm";
import { useRouter } from "next/navigation";

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
}: {
  setWorkspaceName: (name: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const router = useRouter();

  const createAndLink = useMutation(api.workspaces.createAndLink);

  const methods = useForm<FormData>({
    defaultValues: {
      workspace_name: "",
      form_provider: "",
      booking_url: "",
      success_page_url: "",
      min_employees: undefined,
      min_funding_usd: undefined,
      min_revenue_usd: undefined,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setWorkspaceName(data.workspace_name);

    function sanitizeNumber(n: unknown, fallback = 10000) {
      const num = typeof n === "number" ? n : Number(n);
      return typeof num === "number" && !isNaN(num) ? num : fallback;
    }

    try {
      await createAndLink({
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

      // 🚀 Jump straight to dashboard (Setup tab will guide them)
      router.push("/dashboard");
    } catch (error) {
      alert("Error creating workspace: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-4"
        autoComplete="off"
        onSubmit={methods.handleSubmit(onSubmit)}
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
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : "Finish"}
              </button>
            </div>
          </>
        )}
      </form>
    </FormProvider>
  );
}
