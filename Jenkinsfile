pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building....'
                sh 'npm install && npm start && npm build'
            }
        }
        stage('Test') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint'
            }
            steps {
                echo 'Testing...'
                sh 'npm run test'
            }
        }
    }
}
