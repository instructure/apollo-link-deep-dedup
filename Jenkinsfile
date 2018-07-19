CHANNEL_NAME = '#jenkins-test'
committerName = ''

pipeline {
    agent {
        docker {
            image 'node:8-alpine'
        }
    }
    stages {
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
            committerName = sh(returnStdout: true, script: 'git log -1 --pretty=format:'%an'')
            echo committerName
            slackSend (
                channel: CHANNEL_NAME,
                color: 'good',
                message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) by (${env.GIT_COMMITTER}) :happystar:"
            )
        }

        failure {
            slackSend (
                channel: CHANNEL_NAME,
                color: 'danger',
                message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) :u7981:"
            )
        }
    }
}
