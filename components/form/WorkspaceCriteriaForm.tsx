import { useFormContext, FieldError } from "react-hook-form";

export function WorkspaceCriteriaForm() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800">
        Qualification Criteria
      </h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Employees
        </label>
        <input
          type="number"
          placeholder="400"
          {...register("min_employees", {
            required: "Required",
            min: 1,
            valueAsNumber: true,
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.min_employees && (
          <p className="text-sm text-red-600">
            {String((errors.min_employees as FieldError)?.message)}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Funding (USD)
        </label>
        <input
          type="number"
          placeholder="100000000"
          {...register("min_funding_usd", {
            min: 0,
            valueAsNumber: true,
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.min_funding_usd && (
          <p className="text-sm text-red-600">
            {String((errors.min_funding_usd as FieldError)?.message)}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Revenue (USD)
        </label>
        <input
          type="number"
          placeholder="50000000"
          {...register("min_revenue_usd", {
            min: 0,
            valueAsNumber: true,
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.min_revenue_usd && (
          <p className="text-sm text-red-600">
            {String((errors.min_revenue_usd as FieldError)?.message)}
          </p>
        )}
      </div>
    </>
  );
}