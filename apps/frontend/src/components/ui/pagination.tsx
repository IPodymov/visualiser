import { ChevronDown } from 'lucide-react';
import { Button } from './button';

export const Pagination = ({
  shown,
  total,
  onLoadMore,
}: {
  shown: number;
  total: number;
  onLoadMore: () => void;
}) => {
  if (shown >= total) return null;
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-sm text-muted-foreground">
        Показано {shown} из {total}
      </p>
      <Button type="button" variant="outline" onClick={onLoadMore}>
        Показать ещё
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
};
