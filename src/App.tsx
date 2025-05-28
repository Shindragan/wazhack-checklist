import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

type ListType = 'monst' | 'items';
type StatusFilter = 'all' | 'checked' | 'unchecked';

type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
};

const App = () => {
  const [lists, setLists] = useState<Record<ListType | 'newmonsters' | 'newitems', ChecklistItem[]>>({
    monst: [],
    items: [],
    newmonsters: [],
    newitems: [],
  });
  const [activeList, setActiveList] = useState<ListType>('monst');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');  
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('checklistData');
  
    const loadTextFile = async (path: string): Promise<ChecklistItem[]> => {
      const res = await fetch(path);
      const text = await res.text();
      return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((text) => ({ id: uuidv4(), text, checked: false }));
    };
  
    const loadFromTxt = async () => {
      console.log("📥 Loading from .txt files...");
      try {
        const [monstList, itemList] = await Promise.all([
          loadTextFile('/assets/monsterlist.txt'),
          loadTextFile('/assets/itemlist.txt'),
        ]);
  
        const newLists = {
          monst: monstList,
          items: itemList,
          newmonsters: [],
          newitems: [],
        };
  
        setLists(newLists);
        localStorage.setItem('checklistData', JSON.stringify(newLists));
        localStorage.setItem('checklistInitialized', 'true');
        setHasLoaded(true);
      } catch (err) {
        console.error('❌ Failed to load checklist files', err);
      }
    };
  
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
  
        const isValid = parsed &&
          typeof parsed === 'object' &&
          Array.isArray(parsed.monst) && parsed.monst.length > 0 &&
          Array.isArray(parsed.items) && parsed.items.length > 0 &&
          Array.isArray(parsed.newmonsters) &&
          Array.isArray(parsed.newitems);
  
        if (isValid) {
          setLists(parsed);
          console.log('✅ Loaded checklistData from localStorage:', parsed);
          setHasLoaded(true);
          return;
        } else {
          console.warn('⚠️ checklistData invalid or incomplete, loading from .txt...');
          loadFromTxt();
        }
      } catch (e) {
        console.error('❌ Failed to parse checklistData', e);
        loadFromTxt();
      }
    } else {
      console.log('📭 No checklistData found, loading from .txt...');
      loadFromTxt();
    }
  }, []);
    

  useEffect(() => {
    if (hasLoaded) {
      console.log('💾 Saving lists to localStorage after load!');
      localStorage.setItem('checklistData', JSON.stringify(lists));
    }
  }, [lists, hasLoaded]);

  const cycleStatusFilter = () => {
    setStatusFilter((prev) => (prev === 'all' ? 'checked' : prev === 'checked' ? 'unchecked' : 'all'));
  };

  const toggleItem = (id: string) => {
    if (lists.newmonsters.some(item => item.id === id)) {
      setLists((prev) => ({
        ...prev,
        newmonsters: prev.newmonsters.map(item =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      }));
    } else if (lists.newitems.some(item => item.id === id)) {
      setLists((prev) => ({
        ...prev,
        newitems: prev.newitems.map(item =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      }));
    } else if (activeList === 'monst') {
      setLists((prev) => ({
        ...prev,
        monst: prev.monst.map(item =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      }));
    } else {
      setLists((prev) => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      }));
    }
  };

  const addItem = (text: string) => {
    const newItem = { id: uuidv4(), text, checked: false };

    if (activeList === 'monst') {
      setLists((prev) => ({
        ...prev,
        newmonsters: [...prev.newmonsters, newItem],
      }));
    } else {
      setLists((prev) => ({
        ...prev,
        newitems: [...prev.newitems, newItem],
      }));
    }
  };

  const deleteItem = (id: string) => {
    if (lists.newmonsters.some(item => item.id === id)) {
      setLists((prev) => ({
        ...prev,
        newmonsters: prev.newmonsters.filter(item => item.id !== id),
      }));
    } else if (lists.newitems.some(item => item.id === id)) {
      setLists((prev) => ({
        ...prev,
        newitems: prev.newitems.filter(item => item.id !== id),
      }));
    } else if (activeList === 'monst') {
      setLists((prev) => ({
        ...prev,
        monst: prev.monst.filter(item => item.id !== id),
      }));
    } else {
      setLists((prev) => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id),
      }));
    }
  };

  const currentItems = [
    ...lists[activeList],
    ...(activeList === 'monst' ? lists.newmonsters : lists.newitems),
  ];

  const handleStartPress = () => {
    pressTimer = setTimeout(() => {
      resetChecklist();
    }, 3000);
  };

  const handleEndPress = () => {
    clearTimeout(pressTimer);
  };

  let pressTimer: ReturnType<typeof setTimeout>;

const resetChecklist = () => {
  console.log("🧨 Hard resetting localStorage...");
  localStorage.removeItem('checklistData');
  localStorage.removeItem('checklistInitialized');
  window.location.reload();
};  

const isNewItem = (id: string): boolean => {
  return activeList === 'monst'
    ? lists.newmonsters.some(item => item.id === id)
    : lists.newitems.some(item => item.id === id);
};

  return (
    <div className={`app-container ${isEditing ? 'editing' : ''}`}>
      <h1>WazHack Checklist</h1>

      <div className="top-bar">
        <button
          className="edit-toggle-button"
          onMouseDown={handleStartPress}
          onMouseUp={handleEndPress}
          onMouseLeave={handleEndPress}
          onTouchStart={handleStartPress}
          onTouchEnd={handleEndPress}
          onTouchCancel={handleEndPress}
          onClick={() => setIsEditing((prev) => !prev)}
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('addItemInput') as HTMLInputElement;
            if (input.value.trim()) {
              addItem(input.value.trim());
              input.value = '';
            }
          }}
        >
          <input
            name="addItemInput"
            className="add-item-input"
            type="text"
            placeholder="Add a new item & press Enter"
          />
        </form>
      </div>

      <div className="counter-bar">
        <div>
          Counter: {currentItems.filter((i) => i.checked).length} / {currentItems.length}
          <button className="status-filter-button" onClick={cycleStatusFilter}>
            {statusFilter === 'all' && 'All'}
            {statusFilter === 'checked' && '✅'}
            {statusFilter === 'unchecked' && '⬜'}
          </button>
        </div>        
      </div>

      <div className="filter-bar">
        <div className="filter-wrapper">
          <input
            type="text"
            className="filter-input"
            placeholder="Type to filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          {filter && (
            <button
              className="clear-filter-button"
              onClick={() => setFilter('')}
              aria-label="Clear filter"
            >
              X
            </button>
          )}
        </div>
      </div>

      <div className="tab-bar">
        <button
          className={activeList === 'monst' ? 'tab active' : 'tab'}
          onClick={() => setActiveList('monst')}
        >
          Monst
        </button>
        <button
          className={activeList === 'items' ? 'tab active' : 'tab'}
          onClick={() => setActiveList('items')}
        >
          Items
        </button>
      </div>

      <ul>
        {currentItems
          .filter((item) => {
            if (statusFilter === 'checked' && !item.checked) return false;
            if (statusFilter === 'unchecked' && item.checked) return false;
            return true;
          })
          .filter((item) => {
            if (filter.trim() === '') return true;
            const lowerFilter = filter.toLowerCase();
            const words = item.text.toLowerCase().split(/\s+/);
            if (words.some(word => word.startsWith(lowerFilter))) {
              return true;
            }
            return item.text.toLowerCase().includes(lowerFilter);
          })
          .map((item) => (
            <li key={item.id}>
              <button
                className="delete-button"
                onClick={() => deleteItem(item.id)}
                aria-label={`Delete ${item.text}`}
              >
                X
              </button>
              <input
                id={`checkbox-${item.id}`}
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                aria-label={`Toggle ${item.text}`}
              />
              <label 
                htmlFor={`checkbox-${item.id}`}
                className={isNewItem(item.id) ? 'new-item' : ''}
              >
                {item.text}
              </label>
            </li>
          ))}
      </ul>
      
      <div className="bottom-buttons">
        <button
          className="scroll-top-button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ⬆️
        </button>
      </div>
      
    </div>
  );
};

export default App;
