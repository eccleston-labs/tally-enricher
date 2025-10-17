export function IntegrationSnippet({
  workspaceName,
  appUrl,
}: {
  workspaceName: string;
  appUrl: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <pre className="flex-1 bg-gray-100 rounded-md px-3 py-2 text-sm font-mono overflow-x-auto select-all">
        {`${appUrl}?workspace_name=${workspaceName}&email={YOUR EMAIL FIELD}&first_name={FIRST NAME FIELD}&last_name={LAST NAME FIELD}`}
      </pre>
      <button
        type="button"
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold"
        onClick={() =>
          navigator.clipboard.writeText(
            `https://tally-enricher.vercel.app?workspace_name=${workspaceName}&email={YOUR EMAIL FIELD}&first_name={FIRST NAME FIELD}&last_name={LAST NAME FIELD}`,
          )
        }
      >
        Copy
      </button>
    </div>
  );
}
