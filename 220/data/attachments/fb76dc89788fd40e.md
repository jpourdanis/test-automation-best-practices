# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e4]:
    - generic [ref=e5]:
      - combobox "Επιλογή Γλώσσας" [ref=e7]:
        - option "English"
        - option "Español"
        - option "Ελληνικά" [selected]
      - img "logo"
      - heading "Εφαρμογή επιλογής χρώματος" [level=1] [ref=e8]
      - paragraph [ref=e9]:
        - text: Επεξεργαστείτε το
        - code [ref=e10]: src/App.js
        - text: και αποθηκεύστε για επαναφόρτωση.
      - link "Μάθετε React" [ref=e11] [cursor=pointer]:
        - /url: https://reactjs.org
      - generic [ref=e12]: "Τρέχον χρώμα: #1abc9c"
      - generic [ref=e13]:
        - button "Αλλαγή φόντου σε Τιρκουάζ" [ref=e14] [cursor=pointer]: Τιρκουάζ
        - button "Αλλαγή φόντου σε Κόκκινο" [ref=e15] [cursor=pointer]: Κόκκινο
        - button "Αλλαγή φόντου σε Κίτρινο" [ref=e16] [cursor=pointer]: Κίτρινο
  - iframe [ref=e17]:
    - generic [ref=f1e2]:
      - generic [ref=f1e3]: "Compiled with problems:"
      - button "Dismiss" [ref=f1e4] [cursor=pointer]: ×
      - generic [ref=f1e6]:
        - generic [ref=f1e7]: ERROR
        - generic [ref=f1e8]: "EACCES: permission denied, mkdir '/app/node_modules/.cache'"
```