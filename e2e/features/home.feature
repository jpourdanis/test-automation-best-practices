@epic:UI_Components
@feature:Theming
Feature: Home Page Background Color
  As a user
  I want to change the background color
  So that I can customize my viewing experience

  @story:Background_Color_Customization
  @severity:normal
  @jira:UI-456
  Scenario Outline: Change background color
    Given I am on the home page
    When I click the "<color>" color button
    Then the active color text should be "<hex>"
    And the background color should be "<rgb>"

    Examples:
      | color     | hex     | rgb                |
      | Turquoise | #1abc9c | rgb(26, 188, 156)  |
      | Red       | #e74c3c | rgb(231, 76, 60)   |
      | Yellow    | #f1c40f | rgb(241, 196, 15)  |
