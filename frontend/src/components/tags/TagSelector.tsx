import { useTags } from '../../hooks/useSWR';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  // 使用 SWR 自动去重请求和缓存
  const { data: tags, isLoading } = useTags();

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (isLoading) {
    return <div className="text-xs sm:text-sm text-gray-500">加载标签...</div>;
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="text-xs sm:text-sm text-gray-500">
        暂无标签，请先在侧边栏创建标签
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleToggleTag(tag.id)}
            className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              isSelected
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            style={
              isSelected && tag.color ? { backgroundColor: tag.color } : {}
            }
          >
            # {tag.name}
          </button>
        );
      })}
    </div>
  );
}

