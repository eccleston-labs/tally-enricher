"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

interface FormData {
    workspace_name: string;
    form_provider?: string;
    booking_url?: string;
    success_page_url?: string;
    min_employees?: number;
    min_funding_usd?: number;
    min_revenue_usd?: number;
}

export function ConfigForm({ workspace }: { workspace: Doc<"Workspaces"> }) {
    const updateWorkspace = useMutation(api.workspaces.update);

    const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
        defaultValues: {
            workspace_name: workspace.workspace_name,
            form_provider: workspace.form_provider,
            booking_url: workspace.booking_url,
            success_page_url: workspace.success_page_url,
            min_employees: workspace.criteria?.min_employees,
            min_funding_usd: workspace.criteria?.min_funding_usd,
            min_revenue_usd: workspace.criteria?.min_revenue_usd,
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            await updateWorkspace({
                workspace_name: workspace.workspace_name, // original
                new_workspace_name: data.workspace_name,  // new
                form_provider: data.form_provider,
                booking_url: data.booking_url,
                success_page_url: data.success_page_url,
                criteria: {
                    min_employees: data.min_employees,
                    min_funding_usd: data.min_funding_usd,
                    min_revenue_usd: data.min_revenue_usd,
                },
            });
            alert("Workspace updated!");
        } catch (err) {
            alert("Error: " + (err as Error).message);
        }
    };


    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Workspace Name</label>
                <input {...register("workspace_name")} className="mt-1 block w-full border rounded p-2" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Form Provider</label>
                <input {...register("form_provider")} className="mt-1 block w-full border rounded p-2" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Booking URL</label>
                <input {...register("booking_url")} className="mt-1 block w-full border rounded p-2" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Success Page URL</label>
                <input {...register("success_page_url")} className="mt-1 block w-full border rounded p-2" />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Min Employees</label>
                    <input
                        type="number"
                        {...register("min_employees", { valueAsNumber: true })}
                        className="mt-1 block w-full border rounded p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Min Funding (USD)</label>
                    <input
                        type="number"
                        {...register("min_funding_usd", { valueAsNumber: true })}
                        className="mt-1 block w-full border rounded p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Min Revenue (USD)</label>
                    <input
                        type="number"
                        {...register("min_revenue_usd", { valueAsNumber: true })}
                        className="mt-1 block w-full border rounded p-2"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {isSubmitting ? "Saving…" : "Save Changes"}
            </button>
        </form>
    );
}
