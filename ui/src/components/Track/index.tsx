import { useEffect, useState } from "react";
import { ClassificationCategory, ScannedItem } from "../../hooks/types";
import { StatedButton } from "../StatedButton";
import { Waveform } from "../Waveform";
import styles from './styles.module.css';

const Track = ({ 
  track,
  categories,
  onNextTrack,
  onPrevTrack,
  getPrevTrackCategory
}: { 
  track: ScannedItem;
  categories: ClassificationCategory[];
  onNextTrack: () => void;
  onPrevTrack: () => void;
  getPrevTrackCategory: () => Promise<ClassificationCategory[]>;
}): JSX.Element => {
  const [fetching, setFetching] = useState(false);
  const [classifiedCategories, setClassifiedCategories] = useState<ClassificationCategory[]>([]);
  const [tags, setTags] = useState<{ artist?: string, title?: string }>({});
  const [waveform, setWaveform] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/fileinfo?name=${encodeURIComponent(track.name)}`)
      .then(r => r.json())
      .then(r => {
        setClassifiedCategories(r.classification);
        setTags({
          artist: r.tags.artist,
          title: r.tags.title,
        });
        setWaveform(r.waveform);
      })
      .catch(console.error);
  }, [track]);

  const apply = (cats: ClassificationCategory[]) => fetch('/api/add', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: track.name,
      categories: cats,
    }),
  }).catch(console.error);

  const handleSendToRadio = () => {
    fetch('/api/test', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename: track.name }),
    }).then(console.log).catch(console.error);
  }

  const handleSetCategory = (categoryName: string, value: string, flag: boolean) => {
    const isClassified = classifiedCategories.some(cat => cat.name === categoryName);
    let newData = classifiedCategories;

    if (isClassified) {
      newData = newData.map((item) => {
        if (item.name === categoryName) {
          if (flag) {
            return {
              ...item,
              values: [...item.values, value]
            };
          } else {
            return {
              ...item,
              values: item.values.filter(v => v !== value),
            };
          }
        }

        return item;
      });
    } else {
      newData = [...newData, { name: categoryName, values: [value] }];
    }

    setClassifiedCategories(newData);
    apply(newData);
  }

  const handleSetAsPrevious = async () => {
    setFetching(true);
    getPrevTrackCategory()
      .then((data) => {
        setClassifiedCategories(data);
        return apply(data);
      })
      .finally(() => setFetching(false));
  }

  return (
    <div className={styles.root}>
      <div style={{ display: 'flex', gap: '14px' }}>
        <button onClick={handleSendToRadio}>Test stream to icecast</button>
        <button onClick={onPrevTrack}>Prev track</button>
        <button onClick={onNextTrack}>Next track</button>
        <button onClick={handleSetAsPrevious}>Set as previous</button>
        {fetching && <span>applying...</span>}
      </div>

      <div className={styles.trackInfoRoot}>
        <div className={styles.trackPicture} />

        <div className={styles.trackInfo}>
          <span className={styles.trackInfoId3}>{tags.artist || 'unknown artist'} - {tags.title || 'untitled'}</span>
          <span className={styles.trackInfoFName}>{track.name}</span>
          <span className={styles.trackInfoFPath}>{track.path}</span>
        </div>
      </div>

      <Waveform data={waveform} />

      <div>
        <audio controls autoPlay>
          <source src={`/api/file?name=${encodeURIComponent(track.name)}`} />
          Your browser does not support the audio element.
        </audio>
      </div>

      <div className={styles.catsRoot}>
        {categories.map(category => {
          const classified = classifiedCategories.find(cat => cat.name === category.name);

          const btns = category.values.map(value => (
            <StatedButton
              key={value}
              state={classified?.values.includes(value) || false}
              onClick={(nextState) => handleSetCategory(category.name, value, nextState)}
            >
              {value}
            </StatedButton>
          ));

          return (
            <div key={category.name} className={styles.catsItem}>
              <span style={{ fontSize: '12px' }}>{category.name}</span>

              <div className={styles.catsItemBtnsRoot}>
                {btns}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Track;
