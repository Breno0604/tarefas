import '../src/index.css'

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' }
      ]
    }
  },
  decorators: [
    (Story) => (
      <div className="p-6 font-sans">
        <Story />
      </div>
    )
  ]
}

export default preview
