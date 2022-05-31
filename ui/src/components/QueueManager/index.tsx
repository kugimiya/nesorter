import styles from './styles.module.css';
import { ClassificationCategory, QueueItem, QueueType, FSItem } from "../../hooks/types";
import { useCategories } from '../../hooks/useCategories';
import { useEffect, useState } from 'react';
import { useChain } from '../../hooks/useChain';

type Props = {
  queue: QueueType;
  items: QueueItem[];
  addInQueue: (queueId: number, filename: string) => Promise<void>;
  onStream: (queueId: number) => void;
}

export const QueueManager = ({ queue, items, addInQueue, onStream }: Props): JSX.Element => {
  const [categories] = useCategories();
  const [chain] = useChain();
  const chainValues = Object.values(chain);
  const [filters, setFilters] = useState<ClassificationCategory[]>([]);
  const [files, setFiles] = useState<FSItem[]>([]);

  useEffect(() => {
    if (!chainValues.length) {
      return;
    }

    /* eslint no-restricted-globals: 0 */
    const url = new URL('/api/classificator/items', location.origin);
    filters.forEach(({ id, values }) => {
      values.forEach(value => {
        url.searchParams.append(`filters[${id}]`, value);
      });
    });

    fetch(url.toString())
      .then(r => r.json() as unknown as { filehash: string; categories: ClassificationCategory[]; }[])
      .then(r => setFiles(
        r.map(({ filehash }) => {
          return chainValues.find(i => i.fsItem?.filehash === filehash)?.fsItem
        }).filter(i => i !== undefined) as FSItem[]
      ))
      .catch(console.error);
  }, [filters, chainValues.length]);

  const handleToggle = (catId: Number, catName: string, catValue: string) => {
    setFilters([]);
  }

  return (
    <div className={styles.root}>
      <div style={{ display: "inline-flex", justifyContent: 'space-between', width: '100%' }}>
        <span>{queue.name}</span>
        <button
          onClick={() => onStream(queue.id)}
        >Stream this queue to icecast</button>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 'bold', paddingBottom: '8px' }}>Classified</span>

          <div className={styles.trackRoot} style={{ flexDirection: 'column', borderBottom: '1px solid black' }}>
            {categories.map((category) => (
              <div key={category.name} style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px', fontSize: '12px' }}>
                <span>{category.name}:</span>

                {category.values.map((value) => (
                  <span
                    key={value}
                    style={
                      false
                        ? { fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' } 
                        : { cursor: 'pointer', color: '#999' }
                    }
                    onClick={() => handleToggle(category.id, category.name, value)}
                  >{value}</span>
                ))}
              </div>
            ))}
          </div>

          {files.map((file) => (
            <div
              key={file.filehash}
              className={styles.trackRoot}
            >
              <button onClick={() => addInQueue(queue.id, file.filehash)}>Add</button>
              {file.name}
            </div>
          ))}
        </div>

        <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', paddingBottom: '8px' }}>In queue</span>

          {items.map((item) => {
            const file = chainValues.find(i => i.fsItem?.filehash === item.filehash);

            return (
              <div key={item.filehash}>{file?.fsItem?.name}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
