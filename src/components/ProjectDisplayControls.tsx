
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";

interface ProjectDisplayControlsProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showMore: boolean;
  onShowMoreToggle: () => void;
  totalProjects: number;
  displayedProjects: number;
}

export const ProjectDisplayControls = ({
  viewMode,
  onViewModeChange,
  showMore,
  onShowMoreToggle,
  totalProjects,
  displayedProjects
}: ProjectDisplayControlsProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      
      {totalProjects > 6 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onShowMoreToggle}
          className="text-orange-600 border-orange-600 hover:bg-orange-50"
        >
          {showMore ? 'Show Less' : `Show All ${totalProjects} Projects`}
        </Button>
      )}
    </div>
  );
};
