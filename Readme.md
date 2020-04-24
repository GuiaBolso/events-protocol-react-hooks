# Events Protocol React Hooks

## Como usar

Para usar o hook você precisa encapsular sua aplicação em um `<EventProvider>`

No `<EventProvider>` você deve, no mínimo, configurar seu `hostname`

Pra usar, a melhor forma é seguir o [exemplo nesse repositório](https://github.com/GuiaBolso/events-protocol-react-hooks/blob/master/example/app.tsx) ou olhar os testes

O seu componente deve estar sempre encapsulado num `React.Suspense`

O `<EventProvider>` deve estar **FORA** do `React.Suspense`

Estou usando uma técnica instável como no [`react-cache`](https://github.com/facebook/react/tree/master/packages/react-cache)gi
