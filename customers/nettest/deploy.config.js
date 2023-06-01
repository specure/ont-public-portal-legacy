module.exports = {
  test: {
    deploy: {
      user: 'root',
      host: 'test.example.org',
      path: '/home/nettest/html_test'
    }
  },
  beta: {    
    deploy: {
      user: 'root',
      host: 'beta.example.org',
      path: '/home/nettest/html_beta'
    }
  },
  prod: {    
    deploy: {
      user: 'root',
      host: 'example.org',
      path: '/home/nettest/html'
    }
  }
};
