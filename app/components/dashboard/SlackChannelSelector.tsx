import React, { useEffect, useState } from "react";

interface SlackChannel {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface SlackChannelSelectorProps {
  workspaceName: string;
  slackAuthorizeUrl?: string;
}

export default function SlackChannelSelector({ workspaceName, slackAuthorizeUrl }: SlackChannelSelectorProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedChannelId, setSavedChannelId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const fetchChannels = async () => {
      setLoading(true);
      const res = await fetch(`/api/slack/channels?workspaceName=${encodeURIComponent(workspaceName)}`);
      const data = await res.json();

      setConnected(data.connected ?? false);
      if (data.channels) setChannels(data.channels as SlackChannel[]);
      if (data.savedChannelId) setSavedChannelId(data.savedChannelId);

      setLoading(false);
    };
    fetchChannels();
  }, [workspaceName]);

  const saveChannel = async (channelId: string) => {
    await fetch("/api/slack/save-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, workspaceName }),
    });
    setSavedChannelId(channelId);
  };

  if (loading) return <p>Loading channels…</p>;

  if (!connected) {
    return slackAuthorizeUrl ? (
      <a href={slackAuthorizeUrl}>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Connect Slack
        </button>
      </a>
    ) : (
      <p className="text-gray-500">No Slack connection available</p>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Select Channel</h3>
      <ul className="flex flex-wrap justify-center gap-4 w-full">
        {channels.map((c) => (
          <li key={c.id} className="flex-1 min-w-[120px]">
            <button
              className={`w-full px-3 py-2 rounded text-center transition ${
                c.id === savedChannelId
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => saveChannel(c.id)}
            >
              #{c.name}
            </button>
          </li>
        ))}
      </ul>

      {savedChannelId && (
        <p className="text-gray-700 mt-4 text-center">
          Saved channel:{" "}
          <span className="font-semibold">
            #{channels.find((c) => c.id === savedChannelId)?.name ?? "unknown"}
          </span>
        </p>
      )}
    </div>
  );
}
