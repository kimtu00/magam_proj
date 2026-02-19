"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface User {
  user_id: string;
  nickname: string;
  role: string;
  grade_level: number;
  grade_name: string;
  grade_emoji: string;
  total_pickup_count: number;
  total_saved_weight_kg: number;
}

interface UserSearchProps {
  onSelectUser: (user: User) => void;
  selectedUserId?: string | null;
}

export function UserSearch({ onSelectUser, selectedUserId }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/admin/hero/users?q=${encodeURIComponent(debouncedQuery)}`
        );

        if (!response.ok) {
          throw new Error("사용자 검색 실패");
        }

        const data = await response.json();
        setResults(data.data || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="사용자 이름 또는 ID로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results Dropdown */}
      {searchQuery.length >= 2 && (
        <Card className="absolute z-10 w-full mt-2 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="divide-y">
              {results.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => {
                    onSelectUser(user);
                    setSearchQuery("");
                    setResults([]);
                  }}
                  className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                    selectedUserId === user.user_id ? "bg-secondary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.nickname}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.user_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{user.grade_emoji}</span>
                        <Badge variant="outline">{user.grade_name}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        픽업 {user.total_pickup_count}회 · {user.total_saved_weight_kg}kg
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
