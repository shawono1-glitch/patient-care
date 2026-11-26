import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, BackHandler, FlatList, Platform, Pressable, SafeAreaView,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View
} from 'react-native';
import { API_URL } from './config';

const SECTIONS = [
  ['indications', 'নির্দেশনা (কোন রোগে)'], ['usage', 'ব্যবহারের নিয়ম'],
  ['adult_dose', 'প্রাপ্তবয়স্কের মাত্রা'], ['child_dose', 'শিশুর মাত্রা'],
  ['side_effects', 'পার্শ্বপ্রতিক্রিয়া'], ['contraindications', 'যাদের জন্য নিষেধ'],
  ['warnings', 'সতর্কতা'], ['pregnancy', 'গর্ভাবস্থা ও স্তন্যদান'],
  ['interactions', 'অন্য ওষুধের সাথে প্রতিক্রিয়া'], ['storage', 'সংরক্ষণ'],
  ['unit_price', 'একক মূল্য (৳)'], ['pack_info', 'প্যাক'],
  ['source', 'তথ্যের উৎস'], ['updated_at', 'সর্বশেষ হালনাগাদ']
];

async function api(path) {
  const r = await fetch(`${API_URL}/api${path}`);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

export default function App() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const seq = useRef(0);

  const fetchPage = async (n, id) => {
    setLoading(true); setError('');
    try {
      const data = await api(`/medicines?q=${encodeURIComponent(q.trim())}&page=${n}`);
      if (id !== seq.current) return;
      setItems(old => (n === 1 ? data.items : [...old, ...data.items]));
      setTotal(data.total); setPage(n);
    } catch {
      if (id === seq.current) setError('তথ্য আনা যায়নি। সংযোগ দেখে আবার চেষ্টা করুন।');
    } finally {
      if (id === seq.current) setLoading(false);
    }
  };

  useEffect(() => {
    const id = ++seq.current;
    setItems([]); setTotal(0);
    const t = setTimeout(() => fetchPage(1, id), 300);
    return () => clearTimeout(t);
  }, [q, retry]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!selected) return false;
      setSelected(null);
      return true;
    });
    return () => sub.remove();
  }, [selected]);

  const open = async id => {
    setError('');
    try { setSelected(await api(`/medicines/${id}`)); }
    catch { setError('বিস্তারিত তথ্য আনা যায়নি।'); }
  };

  const notice = (
    <Text style={s.notice}>এই তথ্য চিকিৎসকের পরামর্শের বিকল্প নয়। ডাক্তার বা ফার্মাসিস্টের পরামর্শ ছাড়া ওষুধ খাবেন না, বন্ধ বা পরিবর্তন করবেন না।</Text>
  );

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0b6e69" />
      <View style={s.header}><Text style={s.title}>✚ Patient Care</Text></View>
      {selected ? (
        <ScrollView contentContainerStyle={s.body}>
          <Pressable onPress={() => setSelected(null)}><Text style={s.link}>← ফিরে যান</Text></Pressable>
          <Text style={s.name}>{selected.brand} {selected.strength}</Text>
          <Text>{selected.generic} · {selected.form}</Text>
          <Text>{selected.company}</Text>
          {notice}
          {SECTIONS.map(([key, label]) => (
            <View key={key}>
              <Text style={s.label}>{label}</Text>
              <Text>{selected[key] || 'তথ্য নেই'}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={m => String(m.id)}
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <TextInput style={s.input} value={q} onChangeText={setQ} placeholder="ওষুধ বা কোম্পানির নাম" />
              {notice}
              {!!error && <Pressable onPress={() => setRetry(retry + 1)}><Text style={s.error}>{error} (আবার চেষ্টা)</Text></Pressable>}
              {!loading && !error && total === 0 && <Text>কোনো ওষুধ পাওয়া যায়নি</Text>}
            </View>
          }
          renderItem={({ item: m }) => (
            <Pressable style={s.card} onPress={() => open(m.id)}>
              <Text style={s.name}>{m.brand} {m.strength}</Text>
              <Text>{m.generic} · {m.form}</Text>
              <Text style={s.small}>{m.company} · ৳ {m.unit_price || '—'}</Text>
            </Pressable>
          )}
          onEndReached={() => { if (!loading && !error && items.length < total) fetchPage(page + 1, seq.current); }}
          ListFooterComponent={loading ? <ActivityIndicator color="#0b6e69" /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f7f7' },
  header: { backgroundColor: '#0b6e69', padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  body: { padding: 16 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16 },
  notice: { backgroundColor: '#fff4d6', padding: 10, borderRadius: 8, marginVertical: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: '700', color: '#0b6e69' },
  small: { color: '#567', marginTop: 4 },
  label: { marginTop: 16, marginBottom: 4, fontWeight: '700', color: '#0b6e69' },
  link: { color: '#0b6e69', marginBottom: 12, fontSize: 16 },
  error: { color: '#b00020', marginBottom: 8 }
});
