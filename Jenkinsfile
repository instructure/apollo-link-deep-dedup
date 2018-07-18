pipeline {
    CHANNEL_NAME = '#new_jenkins_noisy'
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
    post {
        success {
            slackSend (
                channel: CHANNEL_NAME,
                color: '#00FF00',
                message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) :ok:"
            )

        failure {
            slackSend (
                channel: CHANNEL_NAME,
                color: '#FF0000',
                message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) :u7981:"
            )
        }
    }
}
