import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";

export function VersionBadge() {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    // 在客户端获取版本号
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
    fetch(`${API_BASE_URL}/version`)
      .then((res) => res.json())
      .then((data) => setVersion(data.version || "1"))
      .catch(() => setVersion("1"));
  }, []);

  if (!version) return null;

  return (
    <Badge variant="outline" className="text-xs font-mono">
      v{version}
    </Badge>
  );
}

