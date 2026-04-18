@epic:UI_Components
@feature:Resilience
Feature: API Error Handling
  As a user
  I want the application to handle backend failures gracefully
  So that I am always informed about the state of the app

  @story:Initial_Load_Error @severity:critical @jira:UI-789
  Scenario: Show error message when the initial colors fetch fails
    Given the API returns a server error for the colors list
    And I am on the home page
    Then I should see the error message "Failed to load colors"

  @story:Empty_Response @severity:normal @jira:UI-790
  Scenario: Show loading state when the API returns an empty colors list
    Given the API returns an empty colors list
    And I am on the home page
    Then I should see the text "Loading colors..."

  @story:Color_Fetch_Error @severity:normal @jira:UI-791
  Scenario: Background stays unchanged when fetching a specific color fails
    Given I am on the home page
    And the API returns a server error for the "Red" color
    When I click the "Red" color button
    Then the background color should be "rgb(26, 188, 156)"
