import { useState } from 'react';
import { Category } from './types';
import { ChevronDownIcon, PencilIcon, TrashBinIcon, PlusIcon } from '../../../icons'; 

interface CategoryTableItemProps {
  category: Category;
  level: number;
  rootType?: string;
  onAddChild: (category: Category, rootType: string, ancestors: Category[]) => void;
  ancestors?: Category[];
}

export default function CategoryTableItem({ category, level, rootType, onAddChild, ancestors = [] }: CategoryTableItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  const paddingLeft = level * 24; 
  const currentType = rootType || category.name;
  const isRoot = level === 0;

  const handleAddClick = () => {
      onAddChild(category, rootType || category.name, ancestors);
  };

  return (
    <>
      <tr className="border-b border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-boxdark-2 transition-colors">
        <td className="py-4 px-4 dark:border-strokedark">
          <div 
            className="flex items-center gap-2" 
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-meta-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              >
                <ChevronDownIcon className="w-4 h-4 fill-current text-gray-500" />
              </button>
            ) : (
              <div className="w-6" /> 
            )}
            
            <span className={`font-medium ${isRoot ? 'font-bold text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {category.name}
            </span>
          </div>
        </td>
        
        <td className="py-4 px-4 dark:border-strokedark">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            currentType === 'Informasi' ? 'bg-blue-100 text-blue-800' :
            currentType === 'Request' ? 'bg-green-100 text-green-800' :
            currentType === 'Complaint' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {currentType}
          </span>
        </td>

        <td className="py-4 px-4 text-right dark:border-strokedark">
          <div className="flex items-center justify-end space-x-2">
            <button 
              onClick={handleAddClick}
              className="p-2 text-gray-600 hover:text-primary transition-colors"
              title="Tambah Sub-Kategori"
            >
                <PlusIcon/>
            </button>
            {!isRoot && (
              <>
                <button className="p-2 text-gray-600 hover:text-primary transition-colors" title="Edit">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-500 hover:text-red-700 transition-colors" title="Hapus">
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {isExpanded && hasChildren && category.children.map((child) => (
        <CategoryTableItem 
          key={child.id} 
          category={child} 
          level={level + 1}
          rootType={currentType}
          onAddChild={onAddChild}
          ancestors={[...ancestors, category]}
        />
      ))}
    </>
  );
}