import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Text, 
  Card, 
  Button, 
  TextInput, 
  IconButton, 
  Menu, 
  Provider as PaperProvider,
  useTheme,
  MD3Theme,
  Surface,
  TouchableRipple,
  FAB,
  Divider
} from 'react-native-paper';
import { Plus, MoreVertical, Trash2, Edit2, ArrowLeft, Save } from 'lucide-react-native';

type Note = {
  id: string;
  title: string;
  content: string;
  date: string;
};

function NotesContent() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Meeting Notes',
      content: 'Discuss project timeline and deliverables with the team.',
      date: '2023-05-28',
    },
    {
      id: '2',
      title: 'Ideas',
      content: 'Brainstorming session for new features and improvements.',
      date: '2023-05-27',
    },
  ]);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  const handleAddNote = () => {
    if (newNote.title.trim()) {
      const note = {
        id: Date.now().toString(),
        ...newNote,
        date: new Date().toISOString().split('T')[0],
      };
      setNotes([note, ...notes]);
      setNewNote({ title: '', content: '' });
      setIsAddingNote(false);
    }
  };

  const handleUpdateNote = () => {
    if (editingNote && newNote.title.trim()) {
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id
            ? { ...note, ...newNote }
            : note
        )
      );
      setEditingNote(null);
      setNewNote({ title: '', content: '' });
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
    setMenuVisible({ ...menuVisible, [id]: false });
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNote({ title: note.title, content: note.content });
    setMenuVisible({ ...menuVisible, [note.id]: false });
  };

  const toggleMenu = (id: string) => {
    setMenuVisible({ ...menuVisible, [id]: !menuVisible[id] });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderNote = ({ item }: { item: Note }) => (
    <Card 
      style={[styles.noteCard, { backgroundColor: theme.colors.surface }]}
      mode="elevated"
      elevation={1}
    >
      <Card.Content>
        <View style={styles.noteHeader}>
          <Text 
            variant="titleMedium" 
            style={{ color: theme.colors.onSurface, flex: 1, marginRight: 8 }} 
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Menu
            visible={menuVisible[item.id] || false}
            onDismiss={() => toggleMenu(item.id)}
            anchor={
              <IconButton
                icon={({ size, color }) => <MoreVertical size={size} color={color} />}
                size={20}
                onPress={() => toggleMenu(item.id)}
                style={{ margin: 0 }}
              />
            }
          >
            <Menu.Item
              leadingIcon={({ size, color }) => <Edit2 size={size} color={color} />}
              onPress={() => {
                handleEditNote(item);
                setIsAddingNote(true);
              }}
              title="Edit"
            />
            <Menu.Item
              leadingIcon={({ size, color }) => <Trash2 size={size} color={theme.colors.error} />}
              onPress={() => handleDeleteNote(item.id)}
              title="Delete"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </View>
        <Text 
          variant="bodyMedium" 
          style={{ color: theme.colors.onSurfaceVariant, marginVertical: 8 }} 
          numberOfLines={3}
        >
          {item.content}
        </Text>
        <Text 
          variant="labelSmall" 
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {formatDate(item.date)}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isAddingNote ? (
        <Surface style={[styles.addNoteContainer, { backgroundColor: theme.colors.background }]}>
          <Surface 
            style={[styles.addNoteHeader, { borderBottomColor: theme.colors.outlineVariant }]}
            elevation={1}
          >
            <IconButton
              icon={({ size, color }) => <ArrowLeft size={size} color={color} />}
              size={24}
              onPress={() => {
                setIsAddingNote(false);
                setEditingNote(null);
                setNewNote({ title: '', content: '' });
              }}
              mode="contained-tonal"
            />
            <Text 
              variant="titleMedium" 
              style={{ flex: 1, textAlign: 'center', color: theme.colors.onSurface }}
            >
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>
            <IconButton
              icon={({ size, color }) => <Save size={size} color={color} />}
              onPress={editingNote ? handleUpdateNote : handleAddNote}
              mode="contained-tonal"
              style={{ marginLeft: 8 }}
            />
          </Surface>
          <TextInput
            placeholder="Title"
            value={newNote.title}
            onChangeText={(text) => setNewNote({ ...newNote, title: text })}
            style={[styles.titleInput, { backgroundColor: theme.colors.surface }]}
            mode="outlined"
            autoFocus
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />
          <TextInput
            placeholder="Start writing..."
            value={newNote.content}
            onChangeText={(text) => setNewNote({ ...newNote, content: text })}
            style={[styles.contentInput, { backgroundColor: theme.colors.surface }]}
            multiline
            mode="outlined"
            numberOfLines={10}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />
        </Surface>
      ) : (
        <>
          <FlatList
            data={notes}
            renderItem={renderNote}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.notesList}
            ListEmptyComponent={
              <Surface 
                style={[styles.emptyState, { backgroundColor: 'transparent' }]}
                elevation={0}
              >
                <Text 
                  variant="headlineSmall" 
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
                >
                  No notes yet
                </Text>
                <Text 
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                >
                  Tap the + button to create your first note
                </Text>
              </Surface>
            }
          />
          <FAB
            icon={({ size, color }) => <Plus size={size} color={color} />}
            onPress={() => setIsAddingNote(true)}
            style={[styles.addButton, { backgroundColor: theme.colors.primaryContainer }]}
            color={theme.colors.onPrimaryContainer}
            label="New Note"
          />
        </>
      )}
    </Surface>
  );
}

function NotesScreen() {
  return <NotesContent />;
}

// Import withAuth HOC
import withAuth from '../../../components/withAuth';

// Export protected component
export default withAuth(NotesScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notesList: {
    padding: 16,
    paddingBottom: 80,
  },
  noteCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addNoteContainer: {
    flex: 1,
  },
  addNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  titleInput: {
    margin: 16,
    marginBottom: 8,
  },
  contentInput: {
    flex: 1,
    margin: 16,
    marginTop: 8,
    textAlignVertical: 'top',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 28,
  },
});
