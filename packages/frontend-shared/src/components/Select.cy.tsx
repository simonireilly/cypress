import { defaultMessages } from '@cy/i18n'
import { h } from 'vue'

// Subject Under Test
import Select from './Select.vue'

const selectText = defaultMessages.components.select

// Selectors
const optionsSelector = '[role=option]'
const inputSelector = '[aria-haspopup=true]'
const caretIconSelector = '[data-testid=icon-caret]'
const checkIconSelector = '[data-testid=icon-check]'

// Helpers
const openSelect = () => cy.get(inputSelector).click()
const selectFirstOption = () => cy.get(optionsSelector).first().click().get(optionsSelector).first()

// Fixtures
const defaultOptions = [
  { value: 'Blue', key: 'blue' },
  { value: 'Orange', key: 'orange' },
  { value: 'Fuchsia', key: 'fuchsia' },
]

// Mount wrapper to setup the component with default options
// and some root styles

const mountSelect = (props: any = {}) => {
  // v-model setup
  let value = defaultOptions[0]

  // The width and padding need to be here so that
  // a click on the body dismisses the options
  return cy.mount(() => (
    <div class="p-12 w-300px">
      <Select
        options={defaultOptions}
        modelValue={value}
        {...props}
        v-slots={props.vSlots}
      />
    </div>
  ))
}

describe('<Select />', () => {
  /**
     * Using the Select Component within a template:
     *
     * <Select v-model="value" :options="options">
     *  <template #item-body="{ value, open, selected }">
     *    {{ value }} {{ selected ? 'is selected' : '' }}
     *  </template>
     * </Select>
     */

  it('renders a list of options', () => {
    mountSelect().then(openSelect).get(optionsSelector).should('be.visible')
    cy.percySnapshot()
  })

  it('can open and choose an option', () => {
    mountSelect().then(openSelect)
    .then(selectFirstOption)
    .then(($selectedOption) => {
      cy.get(inputSelector).should('have.text', $selectedOption.text())
    }).get(optionsSelector).should('not.exist')

    cy.percySnapshot()
  })

  it('closes when clicking off of the options when open', () => {
    mountSelect().then(openSelect)
    .get(optionsSelector)
    .should('be.visible')
    .get('html').click(0, 0)
    .get(optionsSelector).should('not.exist')
  })

  describe('#items', () => {
    it('uses item keys and values for what to render', () => {
      // Used for testing that "item-value" supports nested accessors
      // e.g. 'profile.firstName'
      const nestedOptions = [
        { profile: { firstName: 'Lachlan' }, id: 'ewiofjdew' },
        { profile: { firstName: 'Jess' }, id: '1i24u' },
        { profile: { firstName: 'Bart' }, id: 'ewopf' },
      ]

      mountSelect({
        options: nestedOptions,
        modelValue: nestedOptions[0],
        itemKey: 'id',
        itemValue: 'profile.firstName',
      }).then(openSelect)
      .get(optionsSelector).first()
      .should('have.text', nestedOptions[0].profile.firstName)
    })
  })

  describe('#icons', () => {
    // TODO: Fix this
    it.skip('marks the selected item with a check by default', () => {
      mountSelect().then(openSelect)
      .then(selectFirstOption)
      .then(openSelect)
      .get(optionsSelector).first()
      .find(checkIconSelector).should('be.visible')
    })

    it('renders a caret by default', () => {
      mountSelect().get(caretIconSelector).should('be.visible')
    })
  })

  describe('#placeholder', () => {
    it('default placeholder when theres no value selected', () => {
      mountSelect({ modelValue: undefined })
      .get(inputSelector)
      .should('contain.text', selectText.placeholder)
    })

    it('custom placeholder when theres no value selected', () => {
      mountSelect({
        placeholder: 'My placeholder',
        modelValue: undefined,
      }).get(inputSelector).should('contain.text', 'My placeholder')
    })

    it('does not render the placeholder after selecting an option', () => {
      // The width and padding need to be here so that
      // a click on the body dismisses the options
      cy.mount({
        components: { Select },
        data () {
          return {
            model: undefined,
          }
        },
        render () {
          return h(Select, {
            modelValue: this.model,
            'onUpdate:modelValue': (value: any) => this.model = value,
            options: defaultOptions,
            placeholder: 'A placeholder',
          })
        },
      }).then(() => {
        cy.get(inputSelector)
        .should('contain.text', 'A placeholder')
        .then(openSelect)
        .then(selectFirstOption)
        .get(inputSelector)
        .should('not.contain.text', 'A placeholder')
      })
    })

    it('does not render the placeholder when there is a value selected', () => {
      mountSelect({
        placeholder: 'A placeholder',
        modelValue: defaultOptions[0],
      }).get(inputSelector).should('not.contain.text', 'A placeholder')
    })
  })

  describe('#slots', () => {
    it('renders all of the slots', () => {
      const vSlots = {
        'item-body': () => 'Item Body',
        'item-prefix': () => <div data-testid="item-prefix"></div>,
        'item-suffix': () => <div data-testid="item-suffix"></div>,
        'selected': () => 'Selected',
        'input-prefix': () => <div data-testid="input-prefix"></div>,
        'input-suffix': () => <div data-testid="input-suffix"></div>,
      }

      mountSelect({ vSlots })

      // The input and tis prefixes and suffixes should be visible
      cy.findByText('Selected').should('be.visible')
      .get(`[data-testid=input-prefix]`).should('exist')
      .get(`[data-testid=input-suffix]`).should('exist')

      // The caret icon shouldn't exist because we overwrote it
      .get(caretIconSelector).should('not.exist')

      // Open the select
      .then(openSelect)

      // The options and their prefixes + suffixes should be visible
      .get(optionsSelector).should('be.visible')
      .get(`[data-testid=item-prefix]`).should('exist')
      .get(`[data-testid=item-suffix]`).should('exist')
      .percySnapshot()

      // Choose an option
      .then(selectFirstOption)

      // The options list should be closed
      .get(optionsSelector).should('not.exist')
      .get(inputSelector).should('have.text', 'Selected')
      .then(openSelect)

      // The check mark shouldn't exist because we overwrote it
      .get(checkIconSelector).should('not.exist')
    })
  })
})
