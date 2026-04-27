var title$2 = "Color Chooser App";
var instructions$2 = "Edit <1>src/App.js</1> and save to reload.";
var learnReact$2 = "Learn React";
var currentColor$2 = "Current color:";
var colors$2 = {
	turquoise: "Turquoise",
	red: "Red",
	yellow: "Yellow"
};
var languageSelector$2 = "Select Language";
var changeColor$2 = "Change background to";
var add$2 = "+ Add color";
var loading$2 = "Loading colors...";
var remove$2 = "Remove color";
var confirmTitle$2 = "Delete color?";
var confirmBody$2 = "Are you sure you want to delete <b>{{name}}</b>? This cannot be undone.";
var cancel$2 = "Cancel";
var deleting$2 = "Deleting…";
var colorPicker$2 = {
	title: "Add a color",
	dialogAriaLabel: "Add custom color",
	closeAriaLabel: "Close",
	lightnessLabel: "Lightness",
	nameLabel: "Name",
	namePlaceholder: "e.g. Ocean",
	hexLabel: "Hex",
	cancel: "Cancel",
	addColor: "Add color",
	saving: "Saving…",
	errors: {
		nameRequired: "Name is required",
		nameInvalid: "Letters, numbers, spaces, + only",
		nameDuplicate: "\"{{name}}\" already exists",
		hexFormat: "Use format #RRGGBB"
	}
};
var enTranslations = {
	title: title$2,
	instructions: instructions$2,
	learnReact: learnReact$2,
	currentColor: currentColor$2,
	colors: colors$2,
	languageSelector: languageSelector$2,
	changeColor: changeColor$2,
	add: add$2,
	loading: loading$2,
	remove: remove$2,
	confirmTitle: confirmTitle$2,
	confirmBody: confirmBody$2,
	cancel: cancel$2,
	"delete": "Delete",
	deleting: deleting$2,
	colorPicker: colorPicker$2
};

var title$1 = "Aplicación de elección de color";
var instructions$1 = "Edita <1>src/App.js</1> y guarda para recargar.";
var learnReact$1 = "Aprender React";
var currentColor$1 = "Color actual:";
var colors$1 = {
	turquoise: "Turquesa",
	red: "Rojo",
	yellow: "Amarillo"
};
var languageSelector$1 = "Seleccionar Idioma";
var changeColor$1 = "Cambiar el fondo a";
var add$1 = "+ Añadir color";
var loading$1 = "Cargando colores...";
var remove$1 = "Eliminar color";
var confirmTitle$1 = "¿Eliminar color?";
var confirmBody$1 = "¿Seguro que quieres eliminar <b>{{name}}</b>? Esta acción no se puede deshacer.";
var cancel$1 = "Cancelar";
var deleting$1 = "Eliminando…";
var colorPicker$1 = {
	title: "Añadir un color",
	dialogAriaLabel: "Añadir color personalizado",
	closeAriaLabel: "Cerrar",
	lightnessLabel: "Luminosidad",
	nameLabel: "Nombre",
	namePlaceholder: "p. ej. Océano",
	hexLabel: "Hex",
	cancel: "Cancelar",
	addColor: "Añadir color",
	saving: "Guardando…",
	errors: {
		nameRequired: "El nombre es obligatorio",
		nameInvalid: "Solo letras, números, espacios y +",
		nameDuplicate: "\"{{name}}\" ya existe",
		hexFormat: "Usa el formato #RRGGBB"
	}
};
var es = {
	title: title$1,
	instructions: instructions$1,
	learnReact: learnReact$1,
	currentColor: currentColor$1,
	colors: colors$1,
	languageSelector: languageSelector$1,
	changeColor: changeColor$1,
	add: add$1,
	loading: loading$1,
	remove: remove$1,
	confirmTitle: confirmTitle$1,
	confirmBody: confirmBody$1,
	cancel: cancel$1,
	"delete": "Eliminar",
	deleting: deleting$1,
	colorPicker: colorPicker$1
};

var title = "Εφαρμογή επιλογής χρώματος";
var instructions = "Επεξεργαστείτε το <1>src/App.js</1> και αποθηκεύστε για επαναφόρτωση.";
var learnReact = "Μάθετε React";
var currentColor = "Τρέχον χρώμα:";
var colors = {
	turquoise: "Τιρκουάζ",
	red: "Κόκκινο",
	yellow: "Κίτρινο"
};
var languageSelector = "Επιλογή Γλώσσας";
var changeColor = "Αλλαγή φόντου σε";
var add = "+ Προσθήκη χρώματος";
var loading = "Φόρτωση χρωμάτων...";
var remove = "Διαγραφή χρώματος";
var confirmTitle = "Διαγραφή χρώματος;";
var confirmBody = "Θέλετε σίγουρα να διαγράψετε το <b>{{name}}</b>; Η ενέργεια δεν αναιρείται.";
var cancel = "Άκυρο";
var deleting = "Διαγραφή…";
var colorPicker = {
	title: "Προσθήκη χρώματος",
	dialogAriaLabel: "Προσθήκη προσαρμοσμένου χρώματος",
	closeAriaLabel: "Κλείσιμο",
	lightnessLabel: "Φωτεινότητα",
	nameLabel: "Όνομα",
	namePlaceholder: "π.χ. Ωκεανός",
	hexLabel: "Hex",
	cancel: "Άκυρο",
	addColor: "Προσθήκη χρώματος",
	saving: "Αποθήκευση…",
	errors: {
		nameRequired: "Το όνομα είναι υποχρεωτικό",
		nameInvalid: "Μόνο γράμματα, αριθμοί, κενά και +",
		nameDuplicate: "«{{name}}» υπάρχει ήδη",
		hexFormat: "Χρησιμοποιήστε μορφή #RRGGBB"
	}
};
var el = {
	title: title,
	instructions: instructions,
	learnReact: learnReact,
	currentColor: currentColor,
	colors: colors,
	languageSelector: languageSelector,
	changeColor: changeColor,
	add: add,
	loading: loading,
	remove: remove,
	confirmTitle: confirmTitle,
	confirmBody: confirmBody,
	cancel: cancel,
	"delete": "Διαγραφή",
	deleting: deleting,
	colorPicker: colorPicker
};

type Translations = typeof enTranslations;

export { type Translations, el as elTranslations, enTranslations, es as esTranslations };
