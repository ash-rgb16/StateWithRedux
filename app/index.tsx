import { configureStore, createSlice, nanoid } from "@reduxjs/toolkit";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, useWindowDimensions, View } from "react-native";
import AwesomeAlert from "react-native-awesome-alerts";
import { Avatar, Button, Card, Divider, MD3DarkTheme, MD3LightTheme, Provider as PaperProvider, Snackbar, Text, TextInput } from "react-native-paper";
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux";

// Redux: Todos slice with example tasks
const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(title) {
        return { payload: { id: nanoid(), title, done: false, createdAt: Date.now() } };
      },
    },
    addExampleTodos(state, action) {
      if (state.items.length === 0) {
        action.payload.forEach((title) => {
          state.items.push({ id: nanoid(), title, done: false, createdAt: Date.now() });
        });
      }
    },
    toggleTodo(state, action) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
    removeTodo(state, action) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearTodos(state) {
      state.items = [];
    },
  },
});

const { addTodo, addExampleTodos, toggleTodo, removeTodo, clearTodos } = todosSlice.actions;

const store = configureStore({
  reducer: {
    todos: todosSlice.reducer,
  },
});

// Main App wrapper for Redux and PaperProvider
function AppWrapper() {
  const [darkMode, setDarkMode] = useState(false);
  const theme = useMemo(() => (darkMode ? MD3DarkTheme : MD3LightTheme), [darkMode]);
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaView style={{ flex: 1 }}>
          <TodosCard darkMode={darkMode} setDarkMode={setDarkMode} />
        </SafeAreaView>
      </PaperProvider>
    </ReduxProvider>
  );
}

// TodosCard component
function TodosCard({ darkMode, setDarkMode }) {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.todos.items);
  const [title, setTitle] = useState("");
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1;

  // Snackbar and SweetAlert state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const firstLoad = useRef(true);

  // Add example tasks on first load
  useEffect(() => {
    if (firstLoad.current && items.length === 0) {
      dispatch(
        addExampleTodos([
          "Performance Task",
          "Written Task",
          "Project Submission",
          "Group Presentation",
          "Quiz Preparation",
        ])
      );
      firstLoad.current = false;
    }
  }, [dispatch, items.length]);

  // Show snackbar and alert when a new todo is added
  const handleAddTodo = () => {
    if (!title.trim()) return;
    dispatch(addTodo(title.trim()));
    setTitle("");
    setSnackbarVisible(true);
    setAlertVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Split tasks: undone and done
  const undoneTasks = items.filter((item) => !item.done);
  const doneTasks = items.filter((item) => item.done);

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Todos (Redux list)"
        subtitle="Responsive FlatList"
        left={(props) => <Avatar.Icon {...props} icon="check-circle-outline" />}
        right={() => (
          <Button
            mode="contained"
            style={{ marginRight: 12 }}
            onPress={() => setDarkMode((d) => !d)}
          >
            {darkMode ? "Light" : "Dark"}
          </Button>
        )}
      />
      <Card.Content>
        {/* SweetAlert at the very top */}
        <AwesomeAlert
          show={alertVisible}
          showProgress={false}
          title="Success"
          message="Task has been added to the todos (Redux list)"
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={true}
          showConfirmButton={true}
          confirmText="OK"
          confirmButtonColor="#6c47a6"
          onConfirmPressed={() => setAlertVisible(false)}
          onDismiss={() => setAlertVisible(false)}
        />
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
          style={{ marginBottom: 8 }}
        >
          Task has been added to the todos (Redux list)
        </Snackbar>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{ flex: 1 }}
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
          />
          <Button
            mode="contained"
            onPress={handleAddTodo}
          >
            Add
          </Button>
        </View>
        <Divider style={{ marginVertical: 12 }} />

        {/* Undone Tasks */}
        <FlatList
          data={undoneTasks}
          key={numColumns + "-undone"}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ flex: 1, marginRight: numColumns > 1 ? 8 : 0 }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon="circle-outline" />}
              />
              <Card.Actions>
                <Button onPress={() => dispatch(toggleTodo(item.id))}>
                  Done
                </Button>
                <Button onPress={() => dispatch(removeTodo(item.id))} textColor="#d11">
                  Remove
                </Button>
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={
            <Text accessibilityLabel="Empty list">No todos yet. Add one above.</Text>
          }
        />

        {/* Done Tasks */}
        {doneTasks.length > 0 && (
          <>
            <Divider style={{ marginVertical: 12 }} />
            <Text style={{ marginBottom: 8, fontWeight: "bold", color: "#6c47a6" }}>
              Completed Tasks
            </Text>
            <FlatList
              data={doneTasks}
              key={numColumns + "-done"}
              numColumns={numColumns}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Card style={{ flex: 1, marginRight: numColumns > 1 ? 8 : 0, opacity: 0.6 }}>
                  <Card.Title
                    title={item.title}
                    subtitle={new Date(item.createdAt).toLocaleString()}
                    left={(props) => <Avatar.Icon {...props} icon="check" />}
                  />
                  <Card.Actions>
                    <Button onPress={() => dispatch(toggleTodo(item.id))}>
                      Undo
                    </Button>
                    <Button onPress={() => dispatch(removeTodo(item.id))} textColor="#d11">
                      Remove
                    </Button>
                  </Card.Actions>
                </Card>
              )}
            />
          </>
        )}

        {items.length > 0 && (
          <Button style={{ marginTop: 8 }} onPress={() => dispatch(clearTodos())}>
            Clear All
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, borderRadius: 16, overflow: "hidden" },
});

// Default export for Expo Router
export default AppWrapper;