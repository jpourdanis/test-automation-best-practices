@epic:UI_Components
@feature:Internationalization
Feature: Language Switching
  As a user
  I want to switch between supported languages
  So that I can interact with the application in my preferred language

  Background:
    Given I am on the home page

  @story:Language_Switching @severity:normal @jira:UI-123
  Scenario Outline: Switch language and verify translated UI labels
    When I select the language "<code>"
    Then the page title should be "<title>"
    And the "Turquoise" button label should be "<turquoise>"
    And the "Red" button label should be "<red>"
    And the "Yellow" button label should be "<yellow>"

    Examples:
      | code | title                              | turquoise | red     | yellow   |
      | es   | Aplicación de elección de color    | Turquesa  | Rojo    | Amarillo |
      | el   | Εφαρμογή επιλογής χρώματος         | Τιρκουάζ  | Κόκκινο | Κίτρινο  |
      | en   | Color Chooser App                  | Turquoise | Red     | Yellow   |

  @story:Language_Color_Interaction @severity:normal @jira:UI-124
  Scenario: Color button remains functional after switching language
    When I select the language "es"
    And I click the "Turquesa" color button
    Then the background color should be "rgb(26, 188, 156)"
