pipeline {
    agent {
        docker {
            image 'node:8-alpine'
        }
    }
    stages {
        stage('Checkout'){
            steps {
                echo 'Checking out commit....'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Building....'
                sh 'npm install && npm run bootstrap && npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint'
                echo 'Testing...'
                sh 'npm run start & npm run test'
            }
        }
    }
}
