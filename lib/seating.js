/**
 * Seating shuffle logic — pure JS, safe to import in both client and server.
 */

export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createSeatingPairs(people) {
  const males = shuffle(people.filter(p => p.gender === 'L'));
  const females = shuffle(people.filter(p => p.gender === 'P'));

  function pairGroup(group, gender) {
    const pairs = [];
    for (let i = 0; i < group.length; i += 2) {
      const name1 = group[i].nama;
      const name2 = i + 1 < group.length ? group[i + 1].nama : '—';
      pairs.push([name1, name2, gender]);
    }
    return pairs;
  }

  let allPairs = shuffle([...pairGroup(males, 'L'), ...pairGroup(females, 'P')]);

  // Push the singleton (odd-one-out) to the last row
  const singletonIdx = allPairs.findIndex(p => p[1] === '—');
  if (singletonIdx !== -1) {
    const singleton = allPairs.splice(singletonIdx, 1)[0];
    const total = allPairs.length + 1;
    const lastRowStart = Math.floor((total - 1) / 4) * 4;
    allPairs.splice(lastRowStart + 1, 0, singleton);
  }

  return allPairs;
}
